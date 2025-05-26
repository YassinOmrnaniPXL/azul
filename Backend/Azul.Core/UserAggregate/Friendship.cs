using System.ComponentModel.DataAnnotations;

namespace Azul.Core.UserAggregate;

public class Friendship
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    public User User { get; set; }
    
    [Required]
    public Guid FriendId { get; set; }
    public User Friend { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsAccepted { get; set; } = false;
    
    // The user who initiated the friend request
    [Required]
    public Guid RequestedById { get; set; }
    public User RequestedBy { get; set; }
    
    public DateTime? AcceptedAt { get; set; }
} 