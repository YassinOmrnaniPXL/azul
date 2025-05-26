namespace Azul.Api.Models.Output;

public class UserDetailsOutputModel
{
    public Guid Id { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public string? DisplayName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public bool EmailNotificationsEnabled { get; set; }
    public bool SoundEffectsEnabled { get; set; }
    public bool DarkModeEnabled { get; set; }
    public bool IsProfilePublic { get; set; }
} 