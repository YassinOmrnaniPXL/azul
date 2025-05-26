# Profile Picture Implementation

## Overview
This document describes the implementation of profile pictures that are visible to all players in the Azul game, including in the lobby and during gameplay.

## Features Implemented

### 1. User Account Profile Picture Management
- **Upload Profile Pictures**: Users can upload JPG, PNG, GIF images up to 5MB
- **Display Name Usage**: Game now uses `DisplayName` instead of `UserName` for player identification
- **Statistics Removal**: Removed statistics section from user account page
- **Email Notifications**: Removed checkbox from UI but preserved backend functionality

### 2. Cross-Player Profile Picture Visibility
- **New Backend Endpoint**: `GET /api/user/{userId}/profile-picture`
- **Profile Picture Service**: Centralized service for fetching and caching profile pictures
- **CORS Handling**: Profile pictures are fetched as blobs to avoid CORS issues
- **Caching**: Intelligent caching system with automatic cleanup

## Technical Implementation

### Backend Changes

#### New API Endpoint
```csharp
// GET: api/user/{userId}/profile-picture
[HttpGet("{userId}/profile-picture")]
public async Task<IActionResult> GetUserProfilePicture(string userId)
```

**Features:**
- Returns profile picture URL and display name for any user
- Includes comprehensive error handling and logging
- Returns 404 for non-existent users

#### New Output Model
```csharp
public class ProfilePictureOutputModel
{
    public string ProfilePictureUrl { get; set; }
    public string DisplayName { get; set; }
}
```

#### Display Name Integration
- Modified `Table.cs` to use `user.DisplayName ?? user.UserName` when creating players
- Updated all related tests to expect DisplayName instead of UserName

#### Static File Serving
- Added `app.UseStaticFiles()` to serve profile pictures from `wwwroot/UserUploads/ProfilePictures/`
- Added debugging middleware for static file requests
- Updated CORS policy to include frontend ports

### Frontend Changes

#### Profile Picture Service (`profilePictureService.js`)
```javascript
class ProfilePictureService {
    async getProfilePictureUrl(userId) {
        // Caching and fetching logic
    }
    
    async fetchUserProfilePicture(userId) {
        // Uses new endpoint: /api/user/{userId}/profile-picture
        // Handles blob conversion for CORS
    }
}
```

**Features:**
- Fetches any user's profile picture by ID
- Caches results to avoid repeated requests
- Handles blob URL creation and cleanup
- Graceful fallback to default images

#### Integration Points

**Game Renderer (`gameRenderer.js`)**
- Local player board shows profile picture with name
- Opponent boards show profile pictures with names
- Automatic loading via `profilePictureService.getProfilePictureUrl(player.id)`

**Lobby (`lobby.js`)**
- Player cards in waiting room show profile pictures
- Real-time updates when players join/leave
- Uses same profile picture service

**User Account (`useraccount.js`)**
- Profile picture upload with validation
- Cache invalidation when user uploads new picture
- Improved error handling and debugging

## File Structure

### Backend Files
```
Backend/
├── Azul.Api/
│   ├── Controllers/UserController.cs (modified)
│   ├── Models/Output/ProfilePictureOutputModel.cs (new)
│   ├── Program.cs (modified - static files, CORS)
│   └── wwwroot/UserUploads/ProfilePictures/ (profile pictures)
├── Azul.Core/
│   └── TableAggregate/Table.cs (modified - DisplayName)
└── Tests/ (multiple test files updated)
```

### Frontend Files
```
Frontend2/
├── js/
│   ├── profilePictureService.js (modified)
│   ├── gameRenderer.js (already integrated)
│   ├── lobby.js (already integrated)
│   ├── useraccount.js (modified)
│   └── config.js (modified - getFullResourceUrl)
├── useraccount.html (modified - removed stats/email checkbox)
├── game.html (benefits automatically)
└── lobby.html (benefits automatically)
```

## Usage Examples

### Getting a User's Profile Picture
```javascript
// In any frontend component
import { profilePictureService } from './profilePictureService.js';

// Get profile picture URL for any user
const profilePictureUrl = await profilePictureService.getProfilePictureUrl(userId);
imgElement.src = profilePictureUrl;
```

### Backend API Usage
```http
GET /api/user/{userId}/profile-picture
Authorization: Bearer {token}

Response:
{
    "profilePictureUrl": "/UserUploads/ProfilePictures/guid.jpg",
    "displayName": "Player Name"
}
```

## Error Handling

### Frontend
- Graceful fallback to default images on fetch failures
- Console warnings for debugging
- Automatic retry prevention through caching

### Backend
- Comprehensive logging for debugging
- 404 responses for non-existent users
- Validation for file types and sizes

## Performance Considerations

### Caching Strategy
- **Frontend**: In-memory cache with blob URL management
- **Browser**: Standard HTTP caching for static files
- **Cache Invalidation**: Automatic when users upload new pictures

### Blob URL Management
- Automatic cleanup of blob URLs to prevent memory leaks
- Revocation when cache is cleared or users are invalidated

## Security Considerations

### Authentication
- All profile picture requests require valid JWT tokens
- Static file serving doesn't require authentication (public access)

### File Upload Security
- File type validation (JPG, PNG, GIF only)
- File size limits (5MB maximum)
- Unique filename generation to prevent conflicts

### CORS Handling
- Profile pictures fetched as blobs to avoid CORS issues
- Proper CORS configuration for cross-origin requests

## Testing

### Manual Testing Checklist
- [ ] Upload profile picture in user account
- [ ] Verify picture appears in user account
- [ ] Join lobby with another user
- [ ] Verify both users see each other's profile pictures
- [ ] Start game and verify profile pictures appear on player boards
- [ ] Test with users who have no profile pictures (should show default)

### Browser Console Debugging
- Profile picture service logs all fetch attempts
- Backend logs all profile picture requests
- Static file middleware logs file access attempts

## Future Enhancements

### Potential Improvements
1. **Image Optimization**: Automatic resizing/compression on upload
2. **CDN Integration**: Move profile pictures to external CDN
3. **Profile Picture Moderation**: Admin tools for managing inappropriate images
4. **Avatar System**: Predefined avatar options as alternatives to uploads
5. **Profile Picture History**: Allow users to revert to previous pictures

### API Extensions
1. **Batch Profile Pictures**: Endpoint to fetch multiple users' pictures at once
2. **Profile Picture Metadata**: Include upload date, file size, etc.
3. **Public Profile Settings**: Respect user privacy settings for profile visibility 