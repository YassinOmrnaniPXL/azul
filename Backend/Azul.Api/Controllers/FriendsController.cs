using Azul.Api.Services;
using Azul.Core.UserAggregate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Azul.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FriendsController : ApiControllerBase
{
    private readonly IFriendService _friendService;

    public FriendsController(IFriendService friendService)
    {
        _friendService = friendService;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token.");
        }
        return userId;
    }

    // Friend management endpoints
    [HttpPost("send-request")]
    public async Task<ActionResult<object>> SendFriendRequest([FromBody] SendFriendRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var friendship = await _friendService.SendFriendRequestAsync(userId, request.DisplayName);
            
            return Ok(new
            {
                success = true,
                message = "Friend request sent successfully",
                friendshipId = friendship.Id
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("accept-request/{friendshipId}")]
    public async Task<ActionResult<object>> AcceptFriendRequest(Guid friendshipId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var friendship = await _friendService.AcceptFriendRequestAsync(userId, friendshipId);
            
            return Ok(new
            {
                success = true,
                message = "Friend request accepted",
                friendship = new
                {
                    id = friendship.Id,
                    friendName = friendship.User.DisplayName,
                    acceptedAt = friendship.AcceptedAt
                }
            });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("decline-request/{friendshipId}")]
    public async Task<ActionResult<object>> DeclineFriendRequest(Guid friendshipId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _friendService.DeclineFriendRequestAsync(userId, friendshipId);
            
            if (!success)
            {
                return NotFound(new { success = false, message = "Friend request not found" });
            }
            
            return Ok(new { success = true, message = "Friend request declined" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpDelete("remove/{friendId}")]
    public async Task<ActionResult<object>> RemoveFriend(Guid friendId)
    {
        var userId = GetCurrentUserId();
        var success = await _friendService.RemoveFriendAsync(userId, friendId);
        
        if (!success)
        {
            return NotFound(new { success = false, message = "Friendship not found" });
        }
        
        return Ok(new { success = true, message = "Friend removed successfully" });
    }

    // Friend queries
    [HttpGet("list")]
    public async Task<ActionResult<object>> GetFriends()
    {
        var userId = GetCurrentUserId();
        var friends = await _friendService.GetFriendsAsync(userId);
        
        var friendList = friends.Select(f => new
        {
            id = f.Id,
            displayName = f.DisplayName,
            profilePictureUrl = f.ProfilePictureUrl,
            isProfilePublic = f.IsProfilePublic
        });
        
        return Ok(new { success = true, friends = friendList });
    }

    [HttpGet("pending-requests")]
    public async Task<ActionResult<object>> GetPendingFriendRequests()
    {
        var userId = GetCurrentUserId();
        var requests = await _friendService.GetPendingFriendRequestsAsync(userId);
        
        var requestList = requests.Select(r => new
        {
            id = r.Id,
            fromUser = new
            {
                id = r.User.Id,
                displayName = r.User.DisplayName,
                profilePictureUrl = r.User.ProfilePictureUrl
            },
            createdAt = r.CreatedAt
        });
        
        return Ok(new { success = true, requests = requestList });
    }

    [HttpGet("sent-requests")]
    public async Task<ActionResult<object>> GetSentFriendRequests()
    {
        var userId = GetCurrentUserId();
        var requests = await _friendService.GetSentFriendRequestsAsync(userId);
        
        var requestList = requests.Select(r => new
        {
            id = r.Id,
            toUser = new
            {
                id = r.Friend.Id,
                displayName = r.Friend.DisplayName,
                profilePictureUrl = r.Friend.ProfilePictureUrl
            },
            createdAt = r.CreatedAt
        });
        
        return Ok(new { success = true, requests = requestList });
    }

    [HttpGet("search/{displayName}")]
    public async Task<ActionResult<object>> SearchUserByDisplayName(string displayName)
    {
        var user = await _friendService.FindUserByDisplayNameAsync(displayName);
        
        if (user == null)
        {
            return NotFound(new { success = false, message = "User not found" });
        }
        
        var currentUserId = GetCurrentUserId();
        var areFriends = await _friendService.AreFriendsAsync(currentUserId, user.Id);
        var hasPendingRequest = await _friendService.HasPendingFriendRequestAsync(currentUserId, user.Id);
        
        return Ok(new
        {
            success = true,
            user = new
            {
                id = user.Id,
                displayName = user.DisplayName,
                profilePictureUrl = user.ProfilePictureUrl,
                isProfilePublic = user.IsProfilePublic,
                areFriends,
                hasPendingRequest
            }
        });
    }

    // Game invitation endpoints
    [HttpPost("invite-to-game")]
    public async Task<ActionResult<object>> SendGameInvitation([FromBody] SendGameInvitationDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var invitation = await _friendService.SendGameInvitationAsync(
                userId, request.ToUserId, request.TableId, request.Message);
            
            return Ok(new
            {
                success = true,
                message = "Game invitation sent successfully",
                invitationId = invitation.Id
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("accept-game-invitation/{invitationId}")]
    public async Task<ActionResult<object>> AcceptGameInvitation(Guid invitationId)
    {
        var userId = GetCurrentUserId();
        var success = await _friendService.AcceptGameInvitationAsync(userId, invitationId);
        
        if (!success)
        {
            return NotFound(new { success = false, message = "Game invitation not found or already responded to" });
        }
        
        return Ok(new { success = true, message = "Game invitation accepted" });
    }

    [HttpPost("decline-game-invitation/{invitationId}")]
    public async Task<ActionResult<object>> DeclineGameInvitation(Guid invitationId)
    {
        var userId = GetCurrentUserId();
        var success = await _friendService.DeclineGameInvitationAsync(userId, invitationId);
        
        if (!success)
        {
            return NotFound(new { success = false, message = "Game invitation not found or already responded to" });
        }
        
        return Ok(new { success = true, message = "Game invitation declined" });
    }

    [HttpGet("game-invitations")]
    public async Task<ActionResult<object>> GetPendingGameInvitations()
    {
        var userId = GetCurrentUserId();
        var invitations = await _friendService.GetPendingGameInvitationsAsync(userId);
        
        var invitationList = invitations.Select(i => new
        {
            id = i.Id,
            fromUser = new
            {
                id = i.FromUser.Id,
                displayName = i.FromUser.DisplayName,
                profilePictureUrl = i.FromUser.ProfilePictureUrl
            },
            tableId = i.TableId,
            message = i.Message,
            createdAt = i.CreatedAt
        });
        
        return Ok(new { success = true, invitations = invitationList });
    }

    // Private messaging endpoints
    [HttpPost("send-message")]
    public async Task<ActionResult<object>> SendPrivateMessage([FromBody] SendPrivateMessageDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var message = await _friendService.SendPrivateMessageAsync(userId, request.ToUserId, request.Content);
            
            return Ok(new
            {
                success = true,
                message = "Message sent successfully",
                messageId = message.Id,
                createdAt = message.CreatedAt
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpGet("messages/{friendId}")]
    public async Task<ActionResult<object>> GetPrivateMessages(Guid friendId, [FromQuery] int limit = 50)
    {
        try
        {
            var userId = GetCurrentUserId();
            var messages = await _friendService.GetPrivateMessagesAsync(userId, friendId, limit);
            
            var messageList = messages.Select(m => new
            {
                id = m.Id,
                fromUserId = m.FromUserId,
                fromUserName = m.FromUser.DisplayName,
                content = m.Content,
                createdAt = m.CreatedAt,
                isRead = m.IsRead,
                isFromCurrentUser = m.FromUserId == userId
            });
            
            return Ok(new { success = true, messages = messageList });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPost("mark-messages-read/{fromUserId}")]
    public async Task<ActionResult<object>> MarkMessagesAsRead(Guid fromUserId)
    {
        var userId = GetCurrentUserId();
        var success = await _friendService.MarkMessagesAsReadAsync(userId, fromUserId);
        
        return Ok(new { success = true, markedAsRead = success });
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<object>> GetUnreadMessageCount()
    {
        var userId = GetCurrentUserId();
        var count = await _friendService.GetUnreadMessageCountAsync(userId);
        
        return Ok(new { success = true, unreadCount = count });
    }
}

// DTOs for request bodies
public class SendFriendRequestDto
{
    public string DisplayName { get; set; }
}

public class SendGameInvitationDto
{
    public Guid ToUserId { get; set; }
    public Guid TableId { get; set; }
    public string Message { get; set; }
}

public class SendPrivateMessageDto
{
    public Guid ToUserId { get; set; }
    public string Content { get; set; }
} 