using System.ComponentModel.DataAnnotations;

namespace Azul.Api.Models.Input;

public class UpdateProfileInputModel
{
    [StringLength(100, ErrorMessage = "Display name cannot exceed 100 characters.")]
    public string? DisplayName { get; set; }
} 