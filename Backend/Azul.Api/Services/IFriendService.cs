using Azul.Core.UserAggregate;

namespace Azul.Api.Services;

public interface IFriendService
{
    // Friend management
    Task<Friendship> SendFriendRequestAsync(Guid userId, string friendDisplayName);
    Task<Friendship> AcceptFriendRequestAsync(Guid userId, Guid friendshipId);
    Task<bool> DeclineFriendRequestAsync(Guid userId, Guid friendshipId);
    Task<bool> RemoveFriendAsync(Guid userId, Guid friendId);
    
    // Friend queries
    Task<IEnumerable<User>> GetFriendsAsync(Guid userId);
    Task<IEnumerable<Friendship>> GetPendingFriendRequestsAsync(Guid userId);
    Task<IEnumerable<Friendship>> GetSentFriendRequestsAsync(Guid userId);
    Task<User> FindUserByDisplayNameAsync(string displayName);
    
    // Game invitations
    Task<GameInvitation> SendGameInvitationAsync(Guid fromUserId, Guid toUserId, Guid tableId, string message = null);
    Task<bool> AcceptGameInvitationAsync(Guid userId, Guid invitationId);
    Task<bool> DeclineGameInvitationAsync(Guid userId, Guid invitationId);
    Task<IEnumerable<GameInvitation>> GetPendingGameInvitationsAsync(Guid userId);
    
    // Private messaging
    Task<PrivateMessage> SendPrivateMessageAsync(Guid fromUserId, Guid toUserId, string content);
    Task<IEnumerable<PrivateMessage>> GetPrivateMessagesAsync(Guid userId, Guid friendId, int limit = 50);
    Task<bool> MarkMessagesAsReadAsync(Guid userId, Guid fromUserId);
    Task<int> GetUnreadMessageCountAsync(Guid userId);
    
    // Utility methods
    Task<bool> AreFriendsAsync(Guid userId, Guid friendId);
    Task<bool> HasPendingFriendRequestAsync(Guid userId, Guid friendId);
} 