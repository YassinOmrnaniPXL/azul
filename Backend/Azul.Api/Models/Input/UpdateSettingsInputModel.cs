namespace Azul.Api.Models.Input;

public class UpdateSettingsInputModel
{
    public bool EmailNotificationsEnabled { get; set; }
    public bool SoundEffectsEnabled { get; set; }
    public bool DarkModeEnabled { get; set; }
    public bool IsProfilePublic { get; set; }
} 