namespace BattleKnightExtensionAgent.Data.Entities;

/// <summary>
/// One issued refresh token. Rotated on every use: the old row is revoked and
/// points at its replacement, which is what makes a reused token detectable.
/// </summary>
public sealed class RefreshToken
{
    public Guid Id { get; init; } = Guid.CreateVersion7();

    public Guid UserId { get; init; }

    /// <summary>
    /// SHA-256 of the token handed to the client; the token itself is never stored,
    /// so a leaked database doesn't hand over live sessions.
    /// </summary>
    public required string TokenHash { get; init; }

    public DateTimeOffset ExpiresAt { get; init; }

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? RevokedAt { get; set; }

    /// <summary>The token issued in its place, when this one was rotated.</summary>
    public Guid? ReplacedByTokenId { get; set; }

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;
}
