using Azul.Core.UserAggregate;
using Azul.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Azul.Api.Services;

public class FriendService : IFriendService
{
    private readonly AzulExtendedDbContext _context;

    public FriendService(AzulExtendedDbContext context)
    {
        _context = context;
    }

    public async Task<Friendship> SendFriendRequestAsync(Guid userId, string friendDisplayName)
    {
        // Find the friend by display name
        var friend = await FindUserByDisplayNameAsync(friendDisplayName);
        if (friend == null)
        {
            throw new ArgumentException("User with that display name not found.");
        }

        if (friend.Id == userId)
        {
            throw new ArgumentException("You cannot send a friend request to yourself.");
        }

        // Check if they are already friends or have a pending request
        var existingFriendship = await _context.Friendships
            .FirstOrDefaultAsync(f => 
                (f.UserId == userId && f.FriendId == friend.Id) ||
                (f.UserId == friend.Id && f.FriendId == userId));

        if (existingFriendship != null)
        {
            if (existingFriendship.IsAccepted)
            {
                throw new InvalidOperationException("You are already friends with this user.");
            }
            else
            {
                throw new InvalidOperationException("A friend request is already pending with this user.");
            }
        }

        // Create new friendship request
        var friendship = new Friendship
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FriendId = friend.Id,
            RequestedById = userId,
            CreatedAt = DateTime.UtcNow,
            IsAccepted = false
        };

        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        return friendship;
    }

    public async Task<Friendship> AcceptFriendRequestAsync(Guid userId, Guid friendshipId)
    {
        var friendship = await _context.Friendships
            .Include(f => f.User)
            .Include(f => f.Friend)
            .FirstOrDefaultAsync(f => f.Id == friendshipId);

        if (friendship == null)
        {
            throw new ArgumentException("Friend request not found.");
        }

        // Only the recipient can accept the request
        if (friendship.FriendId != userId)
        {
            throw new UnauthorizedAccessException("You can only accept friend requests sent to you.");
        }

        if (friendship.IsAccepted)
        {
            throw new InvalidOperationException("This friend request has already been accepted.");
        }

        friendship.IsAccepted = true;
        friendship.AcceptedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return friendship;
    }

    public async Task<bool> DeclineFriendRequestAsync(Guid userId, Guid friendshipId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == friendshipId);

        if (friendship == null)
        {
            return false;
        }

        // Only the recipient can decline the request
        if (friendship.FriendId != userId)
        {
            throw new UnauthorizedAccessException("You can only decline friend requests sent to you.");
        }

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveFriendAsync(Guid userId, Guid friendId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => 
                ((f.UserId == userId && f.FriendId == friendId) ||
                 (f.UserId == friendId && f.FriendId == userId)) &&
                f.IsAccepted);

        if (friendship == null)
        {
            return false;
        }

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<User>> GetFriendsAsync(Guid userId)
    {
        var friendships = await _context.Friendships
            .Where(f => (f.UserId == userId || f.FriendId == userId) && f.IsAccepted)
            .Include(f => f.User)
            .Include(f => f.Friend)
            .ToListAsync();

        var friends = friendships.Select(f => f.UserId == userId ? f.Friend : f.User);
        return friends;
    }

    public async Task<IEnumerable<Friendship>> GetPendingFriendRequestsAsync(Guid userId)
    {
        return await _context.Friendships
            .Where(f => f.FriendId == userId && !f.IsAccepted)
            .Include(f => f.User)
            .Include(f => f.RequestedBy)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Friendship>> GetSentFriendRequestsAsync(Guid userId)
    {
        return await _context.Friendships
            .Where(f => f.UserId == userId && !f.IsAccepted)
            .Include(f => f.Friend)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<User> FindUserByDisplayNameAsync(string displayName)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.DisplayName == displayName);
    }

    public async Task<GameInvitation> SendGameInvitationAsync(Guid fromUserId, Guid toUserId, Guid tableId, string message = null)
    {
        // Check if they are friends
        if (!await AreFriendsAsync(fromUserId, toUserId))
        {
            throw new UnauthorizedAccessException("You can only invite friends to games.");
        }

        // Check for existing pending invitation for the same table
        var existingInvitation = await _context.GameInvitations
            .FirstOrDefaultAsync(gi => 
                gi.FromUserId == fromUserId && 
                gi.ToUserId == toUserId && 
                gi.TableId == tableId && 
                gi.Status == GameInvitationStatus.Pending);

        if (existingInvitation != null)
        {
            throw new InvalidOperationException("You have already sent an invitation for this game to this user.");
        }

        var invitation = new GameInvitation
        {
            Id = Guid.NewGuid(),
            FromUserId = fromUserId,
            ToUserId = toUserId,
            TableId = tableId,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            Status = GameInvitationStatus.Pending
        };

        _context.GameInvitations.Add(invitation);
        await _context.SaveChangesAsync();

        return invitation;
    }

    public async Task<bool> AcceptGameInvitationAsync(Guid userId, Guid invitationId)
    {
        var invitation = await _context.GameInvitations
            .FirstOrDefaultAsync(gi => gi.Id == invitationId && gi.ToUserId == userId);

        if (invitation == null || invitation.Status != GameInvitationStatus.Pending)
        {
            return false;
        }

        invitation.Status = GameInvitationStatus.Accepted;
        invitation.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeclineGameInvitationAsync(Guid userId, Guid invitationId)
    {
        var invitation = await _context.GameInvitations
            .FirstOrDefaultAsync(gi => gi.Id == invitationId && gi.ToUserId == userId);

        if (invitation == null || invitation.Status != GameInvitationStatus.Pending)
        {
            return false;
        }

        invitation.Status = GameInvitationStatus.Declined;
        invitation.RespondedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<GameInvitation>> GetPendingGameInvitationsAsync(Guid userId)
    {
        return await _context.GameInvitations
            .Where(gi => gi.ToUserId == userId && gi.Status == GameInvitationStatus.Pending)
            .Include(gi => gi.FromUser)
            .OrderByDescending(gi => gi.CreatedAt)
            .ToListAsync();
    }

    public async Task<PrivateMessage> SendPrivateMessageAsync(Guid fromUserId, Guid toUserId, string content)
    {
        // Check if they are friends
        if (!await AreFriendsAsync(fromUserId, toUserId))
        {
            throw new UnauthorizedAccessException("You can only send private messages to friends.");
        }

        var message = new PrivateMessage
        {
            Id = Guid.NewGuid(),
            FromUserId = fromUserId,
            ToUserId = toUserId,
            Content = content.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        _context.PrivateMessages.Add(message);
        await _context.SaveChangesAsync();

        return message;
    }

    public async Task<IEnumerable<PrivateMessage>> GetPrivateMessagesAsync(Guid userId, Guid friendId, int limit = 50)
    {
        // Check if they are friends
        if (!await AreFriendsAsync(userId, friendId))
        {
            throw new UnauthorizedAccessException("You can only view messages with friends.");
        }

        return await _context.PrivateMessages
            .Where(pm => 
                (pm.FromUserId == userId && pm.ToUserId == friendId) ||
                (pm.FromUserId == friendId && pm.ToUserId == userId))
            .Include(pm => pm.FromUser)
            .OrderByDescending(pm => pm.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<bool> MarkMessagesAsReadAsync(Guid userId, Guid fromUserId)
    {
        var unreadMessages = await _context.PrivateMessages
            .Where(pm => pm.ToUserId == userId && pm.FromUserId == fromUserId && !pm.IsRead)
            .ToListAsync();

        if (!unreadMessages.Any())
        {
            return false;
        }

        foreach (var message in unreadMessages)
        {
            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetUnreadMessageCountAsync(Guid userId)
    {
        return await _context.PrivateMessages
            .CountAsync(pm => pm.ToUserId == userId && !pm.IsRead);
    }

    public async Task<bool> AreFriendsAsync(Guid userId, Guid friendId)
    {
        return await _context.Friendships
            .AnyAsync(f => 
                ((f.UserId == userId && f.FriendId == friendId) ||
                 (f.UserId == friendId && f.FriendId == userId)) &&
                f.IsAccepted);
    }

    public async Task<bool> HasPendingFriendRequestAsync(Guid userId, Guid friendId)
    {
        return await _context.Friendships
            .AnyAsync(f => 
                ((f.UserId == userId && f.FriendId == friendId) ||
                 (f.UserId == friendId && f.FriendId == userId)) &&
                !f.IsAccepted);
    }
} 