using Azul.Core.UserAggregate;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Azul.Infrastructure;

public class AzulExtendedDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public AzulExtendedDbContext(DbContextOptions<AzulExtendedDbContext> options) : base(options) { }

    // Friend system DbSets
    public DbSet<Friendship> Friendships { get; set; }
    public DbSet<GameInvitation> GameInvitations { get; set; }
    public DbSet<PrivateMessage> PrivateMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure Identity tables
        builder.Entity<User>().ToTable("Users");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("ExternalLogins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

        // Configure User entity - navigation properties temporarily disabled
        // TODO: Re-enable navigation property configuration once properly set up

        // Configure Friendship entity
        builder.Entity<Friendship>(entity =>
        {
            entity.HasKey(f => f.Id);
            
            // Configure relationships without navigation properties on User
            entity.HasOne(f => f.User)
                .WithMany() // No navigation property on User
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(f => f.Friend)
                .WithMany() // No navigation property on User
                .HasForeignKey(f => f.FriendId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(f => f.RequestedBy)
                .WithMany() // No navigation property on User
                .HasForeignKey(f => f.RequestedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Ensure a user can't be friends with themselves
            entity.ToTable(t => t.HasCheckConstraint("CK_Friendship_NotSelf", "[UserId] != [FriendId]"));
            
            // Create unique index to prevent duplicate friendships
            entity.HasIndex(f => new { f.UserId, f.FriendId }).IsUnique();
        });

        // Configure GameInvitation entity
        builder.Entity<GameInvitation>(entity =>
        {
            entity.HasKey(gi => gi.Id);
            
            // Configure relationships without navigation properties on User
            entity.HasOne(gi => gi.FromUser)
                .WithMany() // No navigation property on User
                .HasForeignKey(gi => gi.FromUserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(gi => gi.ToUser)
                .WithMany() // No navigation property on User
                .HasForeignKey(gi => gi.ToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ensure a user can't invite themselves
            entity.ToTable(t => t.HasCheckConstraint("CK_GameInvitation_NotSelf", "[FromUserId] != [ToUserId]"));
        });

        // Configure PrivateMessage entity
        builder.Entity<PrivateMessage>(entity =>
        {
            entity.HasKey(pm => pm.Id);
            
            // Configure relationships without navigation properties on User
            entity.HasOne(pm => pm.FromUser)
                .WithMany() // No navigation property on User
                .HasForeignKey(pm => pm.FromUserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(pm => pm.ToUser)
                .WithMany() // No navigation property on User
                .HasForeignKey(pm => pm.ToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ensure a user can't message themselves
            entity.ToTable(t => t.HasCheckConstraint("CK_PrivateMessage_NotSelf", "[FromUserId] != [ToUserId]"));
            
            // Index for efficient message retrieval
            entity.HasIndex(pm => new { pm.FromUserId, pm.ToUserId, pm.CreatedAt });
        });
    }
} 