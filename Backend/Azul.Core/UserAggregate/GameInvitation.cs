using System.ComponentModel.DataAnnotations;

namespace Azul.Core.UserAggregate;

public class GameInvitation
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid FromUserId { get; set; }
    public User FromUser { get; set; }
    
    [Required]
    public Guid ToUserId { get; set; }
    public User ToUser { get; set; }
    
    [Required]
    public Guid TableId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public GameInvitationStatus Status { get; set; } = GameInvitationStatus.Pending;
    
    public DateTime? RespondedAt { get; set; }
    
    [StringLength(500)]
    public string Message { get; set; }
}

public enum GameInvitationStatus
{
    Pending = 0,
    Accepted = 1,
    Declined = 2,
    Expired = 3
} 