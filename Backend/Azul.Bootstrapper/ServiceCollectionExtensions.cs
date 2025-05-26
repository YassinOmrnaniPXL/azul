using Azul.Core.UserAggregate;
using Azul.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.TableAggregate;
using Azul.Core.GameAggregate.Contracts;
using Azul.Core.GameAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.PlayerAggregate;

namespace Azul.Bootstrapper;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCore(this IServiceCollection services)
    {
        // Register Core services
        services.AddScoped<ITableManager, TableManager>();
        services.AddScoped<ITableFactory, TableFactory>();
        services.AddScoped<IGameFactory, GameFactory>();
        services.AddScoped<IGamePlayStrategy, GamePlayStrategy>();
        services.AddScoped<IGameService, GameService>();
        
        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        // Determine database provider based on connection string
        bool isPostgreSQL = connectionString.Contains("postgresql://") || connectionString.Contains("postgres://");
        
        // Add Entity Framework DbContext
        services.AddDbContext<AzulDbContext>(options =>
        {
            if (isPostgreSQL)
                options.UseNpgsql(connectionString);
            else
                options.UseSqlServer(connectionString);
        });

        // Add Extended DbContext for friend system
        services.AddDbContext<AzulExtendedDbContext>(options =>
        {
            if (isPostgreSQL)
                options.UseNpgsql(connectionString);
            else
                options.UseSqlServer(connectionString);
        });

        // Register repositories as Singleton for in-memory storage
        services.AddSingleton<ITableRepository, InMemoryTableRepository>();
        services.AddSingleton<IGameRepository, InMemoryGameRepository>();

        // Use AddIdentityCore instead of AddIdentity to avoid overriding authentication schemes
        services.AddIdentityCore<User>(options =>
        {
            // Password settings
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 6;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireLowercase = false;

            // User settings
            options.User.RequireUniqueEmail = true;
            options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

            // Signin settings
            options.SignIn.RequireConfirmedEmail = false;
            options.SignIn.RequireConfirmedPhoneNumber = false;
            options.SignIn.RequireConfirmedAccount = false;

            // Lockout settings
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;
        })
        .AddRoles<IdentityRole<Guid>>()              // Added this for role support
        .AddEntityFrameworkStores<AzulExtendedDbContext>()  // Use extended context for Identity
        .AddDefaultTokenProviders();

        return services;
    }
} 