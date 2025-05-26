using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using System.IdentityModel.Tokens.Jwt;

namespace Azul.Api.Middleware;

public class AuthDiagnosticsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AuthDiagnosticsMiddleware> _logger;

    public AuthDiagnosticsMiddleware(RequestDelegate next, ILogger<AuthDiagnosticsMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Check if it's an API request
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            _logger.LogInformation(
                "Auth request to {Path}, Auth header: {HasAuth}, User authenticated: {IsAuthenticated}",
                context.Request.Path,
                context.Request.Headers.ContainsKey("Authorization"),
                context.User?.Identity?.IsAuthenticated ?? false);

            // If there's an authorization header, analyze the token
            if (context.Request.Headers.TryGetValue("Authorization", out var authHeader) &&
                authHeader.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                string token = authHeader.ToString().Substring("Bearer ".Length).Trim();
                
                try
                {
                    var handler = new JwtSecurityTokenHandler();
                    
                    if (handler.CanReadToken(token))
                    {
                        var jwtToken = handler.ReadJwtToken(token);
                        
                        // Extract exp claim and convert to datetime
                        if (jwtToken.Payload.TryGetValue("exp", out var expValue) && expValue is long expLong)
                        {
                            var expTime = DateTimeOffset.FromUnixTimeSeconds(expLong).UtcDateTime;
                            var currentTime = DateTime.UtcNow;
                            
                            _logger.LogInformation(
                                "Token analysis - Exp: {ExpTime}, Current UTC: {CurrentTime}, Diff: {DiffMinutes} min, IsExpired: {IsExpired}",
                                expTime, 
                                currentTime,
                                (expTime - currentTime).TotalMinutes,
                                expTime < currentTime);
                        }
                        
                        // Log the token's claims
                        _logger.LogInformation("JWT token claims:");
                        foreach (var claim in jwtToken.Claims)
                        {
                            _logger.LogInformation("Claim: {Type} = {Value}", claim.Type, claim.Value);
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Authorization header contains invalid JWT token");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error analyzing JWT token");
                }
            }
        }
        
        await _next(context);
    }
}

// Extension method to add the middleware
public static class AuthDiagnosticsMiddlewareExtensions
{
    public static IApplicationBuilder UseAuthDiagnostics(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<AuthDiagnosticsMiddleware>();
    }
} 