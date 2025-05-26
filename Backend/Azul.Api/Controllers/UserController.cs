using AutoMapper;
using Azul.Api.Models.Input;
using Azul.Api.Models.Output;
using Azul.Core.UserAggregate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Azul.Api.Controllers;

[Route("api/user")]
[Authorize] // All actions in this controller require authentication
public class UserController : ApiControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly IMapper _mapper;
    private readonly IWebHostEnvironment _environment; // For profile picture saving

    public UserController(UserManager<User> userManager, IMapper mapper, IWebHostEnvironment environment)
    {
        _userManager = userManager;
        _mapper = mapper;
        _environment = environment;
    }

    // GET: api/user/details
    [HttpGet("details")]
    [ProducesResponseType(typeof(UserDetailsOutputModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserDetails()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(new ErrorModel("User not found."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new ErrorModel("User not found."));

        var userDetails = _mapper.Map<UserDetailsOutputModel>(user);
        return Ok(userDetails);
    }

    // PUT: api/user/profile
    [HttpPut("profile")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileInputModel model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(new ErrorModel("User not found."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new ErrorModel("User not found."));

        user.DisplayName = model.DisplayName ?? user.DisplayName;
        // Email update functionality removed as requested.

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new ErrorModel(result.Errors.FirstOrDefault()?.Description ?? "Profile update failed."));
        }
        return NoContent();
    }

    // POST: api/user/password
    [HttpPost("password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordInputModel model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(new ErrorModel("User not found."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new ErrorModel("User not found."));

        var changePasswordResult = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!changePasswordResult.Succeeded)
        {
            return BadRequest(new ErrorModel(changePasswordResult.Errors.FirstOrDefault()?.Description ?? "Password change failed."));
        }
        return NoContent();
    }

    // PUT: api/user/settings
    [HttpPut("settings")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsInputModel model)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(new ErrorModel("User not found."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new ErrorModel("User not found."));

        _mapper.Map(model, user); // Apply settings from model to user entity

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new ErrorModel(result.Errors.FirstOrDefault()?.Description ?? "Settings update failed."));
        }
        return NoContent();
    }

    // POST: api/user/profile-picture
    [HttpPost("profile-picture")]
    [ProducesResponseType(typeof(ProfilePictureUploadOutputModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadProfilePicture(IFormFile profilePicture)
    {
        Console.WriteLine($"[UPLOAD] Profile picture upload attempt");
        Console.WriteLine($"[UPLOAD] File is null: {profilePicture == null}");
        Console.WriteLine($"[UPLOAD] File length: {profilePicture?.Length ?? 0}");
        Console.WriteLine($"[UPLOAD] File name: {profilePicture?.FileName ?? "null"}");
        Console.WriteLine($"[UPLOAD] Content type: {profilePicture?.ContentType ?? "null"}");
        Console.WriteLine($"[UPLOAD] User authenticated: {User?.Identity?.IsAuthenticated ?? false}");
        Console.WriteLine($"[UPLOAD] User ID claim: {User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "null"}");

        if (profilePicture == null || profilePicture.Length == 0)
        {
            Console.WriteLine($"[UPLOAD] Rejecting: No file uploaded or file is empty");
            return BadRequest(new ErrorModel("No file uploaded or file is empty."));
        }

        if (profilePicture.Length > 5 * 1024 * 1024) // 5MB limit
        {
            Console.WriteLine($"[UPLOAD] Rejecting: File size exceeds 5MB limit ({profilePicture.Length} bytes)");
            return BadRequest(new ErrorModel("File size exceeds the 5MB limit."));
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
        var extension = Path.GetExtension(profilePicture.FileName).ToLowerInvariant();
        Console.WriteLine($"[UPLOAD] File extension: '{extension}'");
        if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
        {
            Console.WriteLine($"[UPLOAD] Rejecting: Invalid file type. Extension '{extension}' not in allowed list: {string.Join(", ", allowedExtensions)}");
            return BadRequest(new ErrorModel("Invalid file type. Only JPG, JPEG, PNG, GIF are allowed."));
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized(new ErrorModel("User not found."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound(new ErrorModel("User not found."));

        // Save the file - This is a basic example. Consider a more robust storage solution for production.
        // Ensure 'UserUploads/ProfilePictures' directory exists in wwwroot or your static file serving path.
        var uploadsFolderPath = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "UserUploads", "ProfilePictures");
        if (!Directory.Exists(uploadsFolderPath))
            Directory.CreateDirectory(uploadsFolderPath);

        // Generate a unique filename to prevent overwrites and ensure client-side caching works correctly after an update.
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolderPath, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await profilePicture.CopyToAsync(stream);
        }

        // Update user's profile picture URL
        // The URL should be relative to the wwwroot or your static file serving configuration
        var relativePath = $"/UserUploads/ProfilePictures/{fileName}";
        user.ProfilePictureUrl = relativePath;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            // Optionally, delete the uploaded file if DB update fails
            if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
            return BadRequest(new ErrorModel("Failed to update profile picture URL in database."));
        }

        return Ok(new ProfilePictureUploadOutputModel { ProfilePictureUrl = relativePath });
    }

    // GET: api/user/{userId}/profile-picture
    [HttpGet("{userId}/profile-picture")]
    [ProducesResponseType(typeof(ProfilePictureOutputModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserProfilePicture(string userId)
    {
        Console.WriteLine($"[GET-PROFILE-PIC] Request for user ID: {userId}");
        
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) 
        {
            Console.WriteLine($"[GET-PROFILE-PIC] User not found: {userId}");
            return NotFound(new ErrorModel("User not found."));
        }

        Console.WriteLine($"[GET-PROFILE-PIC] User found: {user.DisplayName ?? user.UserName}, ProfilePictureUrl: {user.ProfilePictureUrl ?? "null"}");
        
        var result = new ProfilePictureOutputModel 
        { 
            ProfilePictureUrl = user.ProfilePictureUrl,
            DisplayName = user.DisplayName ?? user.UserName
        };
        
        return Ok(result);
    }
} 