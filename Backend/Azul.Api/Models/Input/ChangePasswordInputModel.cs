using System.ComponentModel.DataAnnotations;

namespace Azul.Api.Models.Input;

public class ChangePasswordInputModel
{
    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; set; }

    [Required(ErrorMessage = "New password is required.")]
    [MinLength(6, ErrorMessage = "New password must be at least 6 characters long.")]
    public string NewPassword { get; set; }
} 