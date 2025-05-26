using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.OpenApi.Models;
using System.Reflection;
using System.Text;
using Azul.Api.Models.Output;
using Azul.Core.UserAggregate;
using Azul.Api.Services;
using Azul.Api.Services.Contracts;
using Azul.Api.Util;
using Azul.Bootstrapper;
using Azul.Api.WS;
using Azul.Api.WS.Decorators;
using Azul.Core.GameAggregate.Contracts;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Azul.Api.Controllers;
using Azul.Api.Hubs;
using Azul.Api.Middleware;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Azul.Infrastructure;

namespace Azul.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            ///////////////////////////////////
            // Dependency injection container//
            ///////////////////////////////////

            builder.Services.AddSingleton(provider =>
                new AzulExceptionFilterAttribute(provider.GetRequiredService<ILogger<Program>>()));

            builder.Services.AddControllers(options =>
            {
                // var onlyAuthenticatedUsersPolicy = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
                //     .RequireAuthenticatedUser().Build();
                // options.Filters.Add(new AuthorizeFilter(onlyAuthenticatedUsersPolicy)); // REMOVED Global authorization filter
                options.Filters.AddService<AzulExceptionFilterAttribute>();
            }).AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new TwoDimensionalArrayJsonConverter<TileSpotModel>());
            }).AddControllersAsServices(); // Add controllers as services for custom DI

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontendApp",
                    policyBuilder => policyBuilder
                        .WithOrigins("http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:8080", "http://localhost:8080")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials());
            });

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Version = "v1",
                    Title = "Azul API",
                    Description = "REST API for online Azul gameplay"
                });

                // Use XML documentation
                string xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml"; //api project
                options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));

                xmlFilename = $"{typeof(User).Assembly.GetName().Name}.xml"; //core layer
                options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));

                // Enable bearer token authentication
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Copy 'Bearer ' + valid token into field. You can retrieve a bearer token via '/api/authentication/token'"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            IConfiguration configuration = builder.Configuration;
            var tokenSettings = new TokenSettings();
            configuration.Bind("Token", tokenSettings);

            // Log the loaded token expiration time
            Console.WriteLine($"Loaded TokenSettings - ExpirationTimeInMinutes: {tokenSettings.ExpirationTimeInMinutes}");
            Console.WriteLine($"Loaded TokenSettings - Issuer: {tokenSettings.Issuer}");
            Console.WriteLine($"Loaded TokenSettings - Audience: {tokenSettings.Audience}");

            // Don't clear DefaultInboundClaimTypeMap - it's needed for proper authentication
            // JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

            builder.Services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidIssuer = tokenSettings.Issuer,
                        ValidAudience = tokenSettings.Audience,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenSettings.Key)),
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ClockSkew = TimeSpan.FromMinutes(5),
                        // Map JWT claims to expected claim types
                        NameClaimType = JwtRegisteredClaimNames.Sub,  // Map 'sub' to Name
                        RoleClaimType = ClaimTypes.Role               // Keep role claims as-is
                    };
                    
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var path = context.Request.Path;
                            if (path.StartsWithSegments("/api/gamehub"))
                            {
                                if (context.Request.Query.TryGetValue("access_token", out var tokenFromQuery) || 
                                    context.Request.Query.TryGetValue("token", out tokenFromQuery) )
                                {
                                    context.Token = tokenFromQuery;
                                }
                            }
                            
                            // Extract token from Authorization header if not already set
                            if (string.IsNullOrEmpty(context.Token))
                            {
                                string authHeader = context.Request.Headers["Authorization"];
                                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                                {
                                    context.Token = authHeader.Substring("Bearer ".Length).Trim();
                                }
                            }
                            
                            Console.WriteLine($"[JWT] OnMessageReceived - Path: {context.Request.Path}");
                            Console.WriteLine($"[JWT] OnMessageReceived - Token: {(context.Token?.Length > 0 ? $"Present ({context.Token.Length} chars)" : "Missing")}");
                            
                            if (!string.IsNullOrEmpty(context.Token))
                            {
                                Console.WriteLine($"[JWT] Token first 50 chars: {context.Token.Substring(0, Math.Min(50, context.Token.Length))}...");
                            }
                            
                            return Task.CompletedTask;
                        },
                        OnAuthenticationFailed = context =>
                        {
                            Console.WriteLine($"[JWT] *** AUTHENTICATION FAILED ***");
                            Console.WriteLine($"[JWT] Exception Type: {context.Exception?.GetType().Name}");
                            Console.WriteLine($"[JWT] Exception Message: {context.Exception?.Message}");
                            Console.WriteLine($"[JWT] Exception: {context.Exception}");
                            
                            if (context.Exception is SecurityTokenExpiredException expiredException)
                            {
                                Console.WriteLine($"[JWT] Token expired at: {expiredException.Expires}");
                                var expiredTime = expiredException.Expires;
                                var correctedTime = expiredTime.AddHours(3).AddMinutes(20);
                                
                                Console.WriteLine($"[JWT] Original expiration: {expiredTime}");
                                Console.WriteLine($"[JWT] Corrected expiration: {correctedTime}");
                                Console.WriteLine($"[JWT] Current UTC time: {DateTime.UtcNow}");
                                
                                if (correctedTime > DateTime.UtcNow)
                                {
                                    Console.WriteLine($"[JWT] Token would be valid with 3h20m correction");
                                }
                            }
                            else if (context.Exception is SecurityTokenInvalidSignatureException)
                            {
                                Console.WriteLine($"[JWT] Invalid signature - check signing key");
                            }
                            else if (context.Exception is SecurityTokenInvalidIssuerException)
                            {
                                Console.WriteLine($"[JWT] Invalid issuer - check issuer configuration");
                            }
                            else if (context.Exception is SecurityTokenInvalidAudienceException)
                            {
                                Console.WriteLine($"[JWT] Invalid audience - check audience configuration");
                            }
                            
                            return Task.CompletedTask;
                        },
                        OnTokenValidated = context =>
                        {
                            Console.WriteLine($"[JWT] Token Validated for: {context.Principal.Identity.Name}");
                            Console.WriteLine($"[JWT] Token ValidTo: {context.SecurityToken.ValidTo}");
                            Console.WriteLine($"[JWT] IsAuthenticated: {context.Principal.Identity.IsAuthenticated}");
                            
                            // Fix claim mapping: With DefaultInboundClaimTypeMap active, claims are auto-mapped
                            var identity = context.Principal.Identity as ClaimsIdentity;
                            if (identity != null)
                            {
                                // With default mappings, 'nameid' gets mapped to ClaimTypes.NameIdentifier automatically
                                // But let's ensure it's there for our controllers
                                var nameIdClaim = identity.FindFirst(ClaimTypes.NameIdentifier) ?? identity.FindFirst("nameid");
                                if (nameIdClaim != null && !identity.HasClaim(ClaimTypes.NameIdentifier, nameIdClaim.Value))
                                {
                                    identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, nameIdClaim.Value));
                                    Console.WriteLine($"[JWT] Ensured NameIdentifier claim: '{nameIdClaim.Value}'");
                                }
                                
                                // Ensure Name claim is set from 'sub'
                                if (string.IsNullOrEmpty(identity.Name))
                                {
                                    var subClaim = identity.FindFirst(JwtRegisteredClaimNames.Sub) ?? identity.FindFirst("sub");
                                    if (subClaim != null)
                                    {
                                        identity.AddClaim(new Claim(ClaimTypes.Name, subClaim.Value));
                                        Console.WriteLine($"[JWT] Set Name claim from sub: '{subClaim.Value}'");
                                    }
                                }
                            }
                            
                            // Log all claims after mapping
                            Console.WriteLine($"[JWT] Final claims in token:");
                            foreach (var claim in context.Principal.Claims)
                            {
                                Console.WriteLine($"[JWT] Claim Type: {claim.Type}, Value: {claim.Value}");
                            }
                            
                            Console.WriteLine($"[JWT] Post-mapping IsAuthenticated: {context.Principal.Identity.IsAuthenticated}");
                            return Task.CompletedTask;
                        },
                        OnChallenge = context =>
                        {
                            Console.WriteLine($"[JWT] Challenge triggered for path: {context.Request.Path}");
                            Console.WriteLine($"[JWT] AuthScheme: {context.AuthenticateFailure?.GetType().Name}");  
                            Console.WriteLine($"[JWT] Error: {context.Error}");
                            Console.WriteLine($"[JWT] ErrorDescription: {context.ErrorDescription}");
                            
                            // When we have a failure, try to examine if the token exists but is invalid
                            string authHeader = context.Request.Headers["Authorization"];
                            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                            {
                                string token = authHeader.Substring("Bearer ".Length).Trim();
                                Console.WriteLine($"[JWT] Authorization header found with token length: {token.Length}");
                                // Don't log the actual token for security reasons
                            }
                            else
                            {
                                Console.WriteLine($"[JWT] No valid Authorization header found");
                            }
                            
                            return Task.CompletedTask;
                        }
                    };
                });

            builder.Services.AddAuthorization();

            // Add SignalR services
            builder.Services.AddSignalR();

            builder.Services.AddAutoMapper(typeof(Program));
            builder.Services.AddSingleton<ITokenFactory>(new JwtTokenFactory(tokenSettings));
            builder.Services.AddCore();
            builder.Services.AddInfrastructure(configuration.GetConnectionString("AzulDbConnection")!);
            
            // Register friend system services
            builder.Services.AddScoped<IFriendService, FriendService>();

            builder.Services.ConfigureApplicationCookie(options =>
            {
                options.Events.OnRedirectToLogin = context =>
                {
                    if (context.Request.Path.StartsWithSegments("/api"))
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    }
                    context.Response.Redirect(context.RedirectUri);
                    return Task.CompletedTask;
                };
            
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    if (context.Request.Path.StartsWithSegments("/api"))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    }
                    context.Response.Redirect(context.RedirectUri);
                    return Task.CompletedTask;
                };
            });

            // Event Bus Registration (reused for WebSockets)
            builder.Services.AddSingleton<IGameEventBus, GameEventBus>();
            
            // Register controllers that need custom DI
            builder.Services.AddScoped<GamesController>();
            
            // Decorate IGameService with GameServiceRealtimeDecorator
            builder.Services.Decorate<IGameService, GameServiceRealtimeDecorator>();

            //////////////////////////////////////////////
            //Create database (if it does not exist yet)//
            //////////////////////////////////////////////

            var app = builder.Build();
            app.EnsureDatabaseIsCreated();

            ////////////////////////
            // Middleware pipeline//
            ////////////////////////

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseCors(policyName: "AllowFrontendApp");

            app.UseHttpsRedirection();
            
            // Add middleware to log static file requests
            app.Use(async (context, next) =>
            {
                if (context.Request.Path.StartsWithSegments("/UserUploads"))
                {
                    Console.WriteLine($"[STATIC] Static file request: {context.Request.Path}");
                    Console.WriteLine($"[STATIC] Physical path would be: {Path.Combine(context.RequestServices.GetRequiredService<IWebHostEnvironment>().WebRootPath ?? "wwwroot", context.Request.Path.Value.TrimStart('/'))}");
                }
                await next();
            });

            // Enable static file serving for profile pictures
            app.UseStaticFiles();
            
            // Add auth diagnostics middleware before authentication
            app.UseAuthDiagnostics();

            // Add middleware to log authentication scheme details
            app.Use(async (context, next) =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    Console.WriteLine($"[MIDDLEWARE] Processing {context.Request.Path}");
                    Console.WriteLine($"[MIDDLEWARE] Auth header present: {context.Request.Headers.ContainsKey("Authorization")}");
                    
                    if (context.Request.Headers.TryGetValue("Authorization", out var authHeader))
                    {
                        Console.WriteLine($"[MIDDLEWARE] Auth header value: {authHeader.ToString().Substring(0, Math.Min(50, authHeader.ToString().Length))}...");
                    }
                    
                    // Check authentication schemes
                    var schemes = context.RequestServices.GetRequiredService<Microsoft.AspNetCore.Authentication.IAuthenticationSchemeProvider>();
                    var defaultScheme = await schemes.GetDefaultAuthenticateSchemeAsync();
                    Console.WriteLine($"[MIDDLEWARE] Default auth scheme: {defaultScheme?.Name ?? "None"}");
                }
                
                await next();
                
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    Console.WriteLine($"[MIDDLEWARE] After auth - IsAuthenticated: {context.User?.Identity?.IsAuthenticated ?? false}");
                    Console.WriteLine($"[MIDDLEWARE] After auth - Identity Name: {context.User?.Identity?.Name ?? "null"}");
                    Console.WriteLine($"[MIDDLEWARE] After auth - Claims count: {context.User?.Claims?.Count() ?? 0}");
                }
            });

            // Make sure authentication comes before authorization
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Add a test endpoint to verify JWT authentication
            app.MapGet("/api/test-auth", (HttpContext context) => {
                Console.WriteLine("[TEST] /api/test-auth endpoint called");
                Console.WriteLine($"[TEST] IsAuthenticated: {context.User.Identity.IsAuthenticated}");
                Console.WriteLine($"[TEST] Username: {context.User.Identity.Name ?? "null"}");
                
                if (context.User.Identity.IsAuthenticated) {
                    Console.WriteLine("[TEST] Authentication successful");
                    return Results.Ok(new { message = "You are authenticated!", username = context.User.Identity.Name });
                } else {
                    Console.WriteLine("[TEST] Authentication failed");
                    string authHeader = context.Request.Headers["Authorization"];
                    if (!string.IsNullOrEmpty(authHeader)) {
                        Console.WriteLine($"[TEST] Authorization header present: {authHeader.StartsWith("Bearer ")}");
                    } else {
                        Console.WriteLine("[TEST] No Authorization header");
                    }
                    return Results.Unauthorized();
                }
            }).RequireAuthorization();
            
            // Add a token validation test endpoint
            app.MapGet("/api/validate-token", (HttpContext context, string token) => {
                if (string.IsNullOrEmpty(token))
                {
                    // Try to get from Authorization header
                    string authHeader = context.Request.Headers["Authorization"];
                    if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                    {
                        token = authHeader.Substring("Bearer ".Length).Trim();
                    }
                }
                
                if (string.IsNullOrEmpty(token))
                {
                    return Results.BadRequest("No token provided");
                }
                
                try
                {
                    var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                    
                    if (!handler.CanReadToken(token))
                    {
                        return Results.BadRequest("Invalid token format");
                    }
                    
                    // Just parse the token without validation
                    var jwtToken = handler.ReadJwtToken(token);
                    
                    // Get exp claim
                    if (jwtToken.Payload.TryGetValue("exp", out var expObj) && expObj is long expLong)
                    {
                        var expTime = DateTimeOffset.FromUnixTimeSeconds(expLong).UtcDateTime;
                        var currentTime = DateTime.UtcNow;
                        
                        var result = new
                        {
                            token_valid = true,
                            parsed_exp = expTime,
                            current_utc = currentTime,
                            is_expired = expTime < currentTime,
                            time_remaining = (expTime - currentTime).TotalMinutes,
                            subject = jwtToken.Subject,
                            claims = jwtToken.Claims.Select(c => new { type = c.Type, value = c.Value }).ToList()
                        };
                        
                        Console.WriteLine($"[TOKEN-VALIDATE] Token exp: {expTime}, Current UTC: {currentTime}");
                        Console.WriteLine($"[TOKEN-VALIDATE] Is expired: {expTime < currentTime}, Minutes remaining: {(expTime - currentTime).TotalMinutes}");
                        
                        return Results.Ok(result);
                    }
                    
                    return Results.BadRequest("Token has no expiration claim");
                }
                catch (Exception ex)
                {
                    return Results.BadRequest($"Error validating token: {ex.Message}");
                }
            });

            // Map SignalR Hub
            app.MapHub<GameWebSocketHub>("/api/gamehub");

            app.Run();
        }
    }
}
