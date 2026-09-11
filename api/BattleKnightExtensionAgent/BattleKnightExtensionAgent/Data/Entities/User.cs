namespace BattleKnightExtensionAgent.Data.Entities;

public sealed class User
{
    /// <summary>
    /// Version 7 GUIDs are time-ordered, so they index far better than random ones.
    /// </summary>
    public Guid Id { get; init; } = Guid.CreateVersion7();

    /// <summary>Always stored lowercase and trimmed — see AuthEndpoints.</summary>
    public required string Email { get; set; }

    public required string PasswordHash { get; set; }

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
