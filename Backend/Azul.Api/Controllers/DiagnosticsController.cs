using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Azul.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DiagnosticsController : ControllerBase
{
    private readonly ILogger<DiagnosticsController> _logger;

    public DiagnosticsController(ILogger<DiagnosticsController> logger)
    {
        _logger = logger;
    }

    [HttpGet("jwt-times")]
    [AllowAnonymous]
    public IActionResult GetJwtTimes()
    {
        // Gather current time information in multiple formats
        var utcNow = DateTime.UtcNow;
        var localNow = DateTime.Now;
        var unixTimestampNow = new DateTimeOffset(utcNow).ToUnixTimeSeconds();
        
        // Create times for +1 hour (standard token lifetime)
        var utcExpires = utcNow.AddHours(1);
        var localExpires = localNow.AddHours(1);
        var unixTimestampExpires = new DateTimeOffset(utcExpires).ToUnixTimeSeconds();
        
        // Create times for the problematic -3h20m time
        var utcProblematic = utcNow.AddHours(-3).AddMinutes(-20);
        var localProblematic = localNow.AddHours(-3).AddMinutes(-20);
        var unixTimestampProblematic = new DateTimeOffset(utcProblematic).ToUnixTimeSeconds();
        
        return Ok(new
        {
            current = new
            {
                utc = utcNow,
                local = localNow,
                unix_timestamp = unixTimestampNow,
                timezone_info = TimeZoneInfo.Local.DisplayName,
                timezone_offset = TimeZoneInfo.Local.BaseUtcOffset,
                daylight_savings = TimeZoneInfo.Local.IsDaylightSavingTime(DateTime.Now)
            },
            expires_1hr = new
            {
                utc = utcExpires,
                local = localExpires,
                unix_timestamp = unixTimestampExpires
            },
            problematic_time = new
            {
                utc = utcProblematic,
                local = localProblematic,
                unix_timestamp = unixTimestampProblematic
            },
            time_diff_from_utc = new
            {
                hours = (DateTime.Now - DateTime.UtcNow).TotalHours,
                minutes = (DateTime.Now - DateTime.UtcNow).TotalMinutes
            }
        });
    }
    
    [HttpGet("parse-token")]
    [AllowAnonymous]
    public IActionResult ParseToken([FromQuery] string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest("Token is required");
        }
        
        try
        {
            var handler = new JwtSecurityTokenHandler();
            
            if (!handler.CanReadToken(token))
            {
                return BadRequest("Invalid token format");
            }
            
            var jwtToken = handler.ReadJwtToken(token);
            
            // Extract expiration time
            long expTimestamp = 0;
            if (jwtToken.Payload.TryGetValue("exp", out var expValue) && expValue is long expLong)
            {
                expTimestamp = expLong;
            }
            
            var expTime = DateTimeOffset.FromUnixTimeSeconds(expTimestamp).UtcDateTime;
            var correctedExpTime = expTime.AddHours(3).AddMinutes(20);
            
            _logger.LogInformation(
                "Token parsed - Exp: {ExpTime}, Corrected: {CorrectedExpTime}, Current: {CurrentTime}",
                expTime, correctedExpTime, DateTime.UtcNow);
            
            return Ok(new
            {
                token_header = jwtToken.Header,
                token_payload = jwtToken.Payload,
                expiration_utc = expTime,
                corrected_expiration_utc = correctedExpTime,
                current_time_utc = DateTime.UtcNow,
                is_expired = expTime < DateTime.UtcNow,
                would_be_valid_with_correction = correctedExpTime > DateTime.UtcNow,
                subject = jwtToken.Subject,
                issuer = jwtToken.Issuer,
                audience = jwtToken.Audiences.FirstOrDefault()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing token");
            return BadRequest($"Error parsing token: {ex.Message}");
        }
    }
    
    [HttpGet("auth-status")]
    public IActionResult GetAuthStatus()
    {
        return Ok(new
        {
            is_authenticated = User.Identity?.IsAuthenticated ?? false,
            identity_name = User.Identity?.Name,
            claim_count = User.Claims?.Count() ?? 0,
            claims = User.Claims?.Select(c => new { type = c.Type, value = c.Value })
        });
    }
} 