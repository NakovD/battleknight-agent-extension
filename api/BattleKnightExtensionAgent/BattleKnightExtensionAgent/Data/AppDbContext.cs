using BattleKnightExtensionAgent.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BattleKnightExtensionAgent.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<DuelsSettings> DuelsSettings => Set<DuelsSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<DuelsSettings>(settings =>
        {
            settings.HasKey(s => s.UserId);

            // Deleting a user removes their settings with them.
            settings.HasOne<User>()
                .WithOne()
                .HasForeignKey<DuelsSettings>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Stored as a JSON array column — a separate table for a short list of
            // order names would add a join for no benefit.
            settings.PrimitiveCollection(s => s.OrdersToSkip).IsRequired();
        });

        modelBuilder.Entity<User>(user =>
        {
            user.HasKey(u => u.Id);

            user.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);

            // Enforced in the database, not just in the register handler — two
            // concurrent registrations would otherwise both pass the existence check.
            user.HasIndex(u => u.Email).IsUnique();

            user.Property(u => u.PasswordHash).IsRequired();
        });
    }
}
