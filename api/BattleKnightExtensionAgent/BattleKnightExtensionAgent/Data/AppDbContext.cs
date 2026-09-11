using BattleKnightExtensionAgent.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BattleKnightExtensionAgent.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
