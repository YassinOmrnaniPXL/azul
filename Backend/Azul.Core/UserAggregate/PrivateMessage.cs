using System.ComponentModel.DataAnnotations;

namespace Azul.Core.UserAggregate;

public class PrivateMessage
{
    public Guid Id { get; set; }
    
    [Required]
    public Guid FromUserId { get; set; }
    public User FromUser { get; set; }
    
    [Required]
    public Guid ToUserId { get; set; }
    public User ToUser { get; set; }
    
    [Required]
    [StringLength(1000)]
    public string Content { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsRead { get; set; } = false;
    
    public DateTime? ReadAt { get; set; }
} 