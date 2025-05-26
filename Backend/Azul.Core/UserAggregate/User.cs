using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace Azul.Core.UserAggregate;

public class User : IdentityUser<Guid>
{
    public DateOnly? LastVisitToPortugal { get; set; }

    // New properties for user account page
    [StringLength(100)]
    public string? DisplayName { get; set; }

    [StringLength(2048)] // Max URL length
    public string? ProfilePictureUrl { get; set; }

    public bool EmailNotificationsEnabled { get; set; } = true;
    public bool SoundEffectsEnabled { get; set; } = true;
    public bool DarkModeEnabled { get; set; } = false;
    public bool IsProfilePublic { get; set; } = true;

    // Friend system navigation properties - temporarily disabled to fix tests
    // TODO: Re-enable these navigation properties once the EF configuration is properly set up
    // public ICollection<Friendship> InitiatedFriendships { get; set; } = new List<Friendship>();
    // public ICollection<Friendship> ReceivedFriendships { get; set; } = new List<Friendship>();
    // public ICollection<GameInvitation> SentGameInvitations { get; set; } = new List<GameInvitation>();
    // public ICollection<GameInvitation> ReceivedGameInvitations { get; set; } = new List<GameInvitation>();
    // public ICollection<PrivateMessage> SentMessages { get; set; } = new List<PrivateMessage>();
    // public ICollection<PrivateMessage> ReceivedMessages { get; set; } = new List<PrivateMessage>();
}