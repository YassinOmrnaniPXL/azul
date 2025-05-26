# Friend System Implementation

## Overview

This document describes the implementation of a comprehensive friend system for the Azul game application. The friend system allows users to:

- Add friends by display name
- Accept/decline friend requests
- Send private messages to friends
- Invite friends to games
- Manage friend relationships

## Architecture

### Backend Components

#### 1. Domain Models (`Backend/Azul.Core/UserAggregate/`)

- **`Friendship.cs`**: Represents friend relationships between users
  - Tracks friendship status (pending/accepted)
  - Records who initiated the request
  - Timestamps for creation and acceptance

- **`GameInvitation.cs`**: Represents game invitations between friends
  - Links to specific game tables
  - Tracks invitation status (pending/accepted/declined/expired)
  - Optional message from sender

- **`PrivateMessage.cs`**: Represents private messages between friends
  - Message content with length limits
  - Read status tracking
  - Timestamps for creation and reading

#### 2. Database Context (`Backend/Azul.Infrastructure/`)

- **`AzulExtendedDbContext.cs`**: Extended DbContext including friend system entities
  - Configures entity relationships
  - Sets up foreign key constraints
  - Defines indexes for performance

#### 3. Services (`Backend/Azul.Api/Services/`)

- **`IFriendService.cs`**: Interface defining friend system operations
- **`FriendService.cs`**: Implementation of friend system business logic
  - Friend request management
  - Game invitation handling
  - Private messaging
  - User search functionality

#### 4. API Controller (`Backend/Azul.Api/Controllers/`)

- **`FriendsController.cs`**: REST API endpoints for friend system
  - Authentication required for all endpoints
  - Comprehensive error handling
  - Input validation

#### 5. WebSocket Integration (`Backend/Azul.Api/Hubs/`)

- **`GameWebSocketHub.cs`**: Extended with friend system notifications
  - Real-time friend request notifications
  - Private message delivery
  - Game invitation alerts

### Frontend Components

#### 1. Services (`Frontend2/js/`)

- **`friendService.js`**: API client for friend system operations
  - Handles all HTTP requests to friend endpoints
  - Error handling and response parsing
  - Authentication header management

#### 2. UI Components (`Frontend2/js/`)

- **`friendSystemComponent.js`**: Main UI component for friend system
  - Tabbed interface (Friends, Requests, Invitations, Search)
  - Real-time data updates
  - Interactive friend management

#### 3. Integration (`Frontend2/`)

- **`lobby.html`**: Updated layout to include friend system
- **`lobby.js`**: Integrated friend system initialization

## Database Schema

### Friendships Table

```sql
CREATE TABLE Friendships (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    FriendId UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    IsAccepted BIT NOT NULL DEFAULT 0,
    RequestedById UNIQUEIDENTIFIER NOT NULL,
    AcceptedAt DATETIME2 NULL,
    
    CONSTRAINT FK_Friendships_Users_UserId FOREIGN KEY (UserId) REFERENCES Users(Id),
    CONSTRAINT FK_Friendships_Users_FriendId FOREIGN KEY (FriendId) REFERENCES Users(Id),
    CONSTRAINT FK_Friendships_Users_RequestedById FOREIGN KEY (RequestedById) REFERENCES Users(Id),
    CONSTRAINT CK_Friendship_NotSelf CHECK (UserId != FriendId),
    CONSTRAINT UQ_Friendships_UserId_FriendId UNIQUE (UserId, FriendId)
);
```

### GameInvitations Table

```sql
CREATE TABLE GameInvitations (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    FromUserId UNIQUEIDENTIFIER NOT NULL,
    ToUserId UNIQUEIDENTIFIER NOT NULL,
    TableId UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    Status INT NOT NULL DEFAULT 0, -- 0=Pending, 1=Accepted, 2=Declined, 3=Expired
    RespondedAt DATETIME2 NULL,
    Message NVARCHAR(500) NULL,
    
    CONSTRAINT FK_GameInvitations_Users_FromUserId FOREIGN KEY (FromUserId) REFERENCES Users(Id),
    CONSTRAINT FK_GameInvitations_Users_ToUserId FOREIGN KEY (ToUserId) REFERENCES Users(Id),
    CONSTRAINT CK_GameInvitation_NotSelf CHECK (FromUserId != ToUserId)
);
```

### PrivateMessages Table

```sql
CREATE TABLE PrivateMessages (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    FromUserId UNIQUEIDENTIFIER NOT NULL,
    ToUserId UNIQUEIDENTIFIER NOT NULL,
    Content NVARCHAR(1000) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    IsRead BIT NOT NULL DEFAULT 0,
    ReadAt DATETIME2 NULL,
    
    CONSTRAINT FK_PrivateMessages_Users_FromUserId FOREIGN KEY (FromUserId) REFERENCES Users(Id),
    CONSTRAINT FK_PrivateMessages_Users_ToUserId FOREIGN KEY (ToUserId) REFERENCES Users(Id),
    CONSTRAINT CK_PrivateMessage_NotSelf CHECK (FromUserId != ToUserId)
);
```

## API Endpoints

### Friend Management

- `POST /api/Friends/send-request` - Send friend request
- `POST /api/Friends/accept-request/{friendshipId}` - Accept friend request
- `POST /api/Friends/decline-request/{friendshipId}` - Decline friend request
- `DELETE /api/Friends/remove/{friendId}` - Remove friend
- `GET /api/Friends/list` - Get friends list
- `GET /api/Friends/pending-requests` - Get pending friend requests
- `GET /api/Friends/sent-requests` - Get sent friend requests
- `GET /api/Friends/search/{displayName}` - Search user by display name

### Game Invitations

- `POST /api/Friends/invite-to-game` - Send game invitation
- `POST /api/Friends/accept-game-invitation/{invitationId}` - Accept game invitation
- `POST /api/Friends/decline-game-invitation/{invitationId}` - Decline game invitation
- `GET /api/Friends/game-invitations` - Get pending game invitations

### Private Messaging

- `POST /api/Friends/send-message` - Send private message
- `GET /api/Friends/messages/{friendId}` - Get message history
- `POST /api/Friends/mark-messages-read/{fromUserId}` - Mark messages as read
- `GET /api/Friends/unread-count` - Get unread message count

## Features

### 1. Friend Requests

- Users can send friend requests by display name
- Duplicate requests are prevented
- Self-friendship is blocked
- Bidirectional friendship records are created

### 2. Game Invitations

- Friends can invite each other to specific game tables
- Invitations include optional messages
- Automatic expiration of old invitations
- Integration with lobby system

### 3. Private Messaging

- Real-time messaging between friends
- Message read status tracking
- Message history with pagination
- Unread message counters

### 4. User Interface

- Tabbed interface for different friend system functions
- Real-time updates every 30 seconds
- Notification badges for pending requests/invitations
- Profile picture integration
- Search functionality with instant feedback

## Security Considerations

### Authentication & Authorization

- All endpoints require authentication
- Users can only access their own friend data
- Friend relationships are bidirectional for security
- Input validation on all user inputs

### Data Protection

- Message content length limits
- SQL injection prevention through parameterized queries
- XSS prevention through proper encoding
- CORS configuration for API access

## Performance Optimizations

### Database Indexes

- Composite indexes on frequently queried columns
- Foreign key indexes for join performance
- Unique constraints to prevent duplicates

### Caching Strategy

- Frontend caching of friend lists
- Periodic refresh to balance performance and freshness
- Efficient API response structures

### Query Optimization

- Eager loading of related entities
- Pagination for message history
- Efficient friend status checking

## Installation & Setup

### 1. Database Migration

Run the friend system migration:

```bash
dotnet ef database update --project Backend/Azul.Infrastructure --startup-project Backend/Azul.Api
```

### 2. Service Registration

The friend system services are automatically registered in `Program.cs`:

```csharp
builder.Services.AddScoped<IFriendService, FriendService>();
```

### 3. Frontend Integration

The friend system is automatically initialized in the lobby:

```javascript
// In lobby.js
import { FriendSystemComponent } from './friendSystemComponent.js';

// Initialize friend system
friendSystemComponent = new FriendSystemComponent('friend-system-container');
```

## Usage Examples

### Sending a Friend Request

```javascript
const friendService = new FriendService();
await friendService.sendFriendRequest('JohnDoe123');
```

### Accepting a Friend Request

```javascript
await friendService.acceptFriendRequest(friendshipId);
```

### Sending a Game Invitation

```javascript
await friendService.sendGameInvitation(friendUserId, tableId, 'Want to play?');
```

### Sending a Private Message

```javascript
await friendService.sendPrivateMessage(friendUserId, 'Hello there!');
```

## Future Enhancements

### Planned Features

1. **Real-time Notifications**: WebSocket-based instant notifications
2. **Friend Groups**: Organize friends into custom groups
3. **Blocking System**: Block unwanted users
4. **Friend Recommendations**: Suggest friends based on game history
5. **Enhanced Privacy**: More granular privacy controls

### Technical Improvements

1. **Caching Layer**: Redis integration for better performance
2. **Message Encryption**: End-to-end encryption for private messages
3. **Rate Limiting**: Prevent spam and abuse
4. **Analytics**: Friend system usage analytics
5. **Mobile Support**: Responsive design improvements

## Troubleshooting

### Common Issues

1. **Friend requests not appearing**: Check authentication and refresh data
2. **Profile pictures not loading**: Verify CORS configuration and image URLs
3. **Messages not sending**: Check network connectivity and authentication
4. **Database errors**: Ensure migration has been applied

### Debug Information

Enable debug logging in `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Azul.Api.Services.FriendService": "Debug"
    }
  }
}
```

## Contributing

When contributing to the friend system:

1. Follow existing code patterns and naming conventions
2. Add appropriate unit tests for new functionality
3. Update this documentation for any changes
4. Ensure backward compatibility
5. Test thoroughly with multiple users

## License

This friend system implementation is part of the Azul game project and follows the same licensing terms. 