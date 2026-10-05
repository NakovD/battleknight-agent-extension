using BattleKnightExtensionAgent.Data.Entities;

namespace BattleKnightExtensionAgent.Features.Auth;

/// <summary>The token handed to the client, in the only form it is ever readable.</summary>
public readonly record struct IssuedRefreshToken(string Value, DateTimeOffset ExpiresAt);

public interface IRefreshTokenService
{
    Task<IssuedRefreshToken> IssueAsync(User user, CancellationToken cancellationToken);

    /// <summary>
    /// Exchanges a refresh token for a fresh pair, revoking the one presented.
    /// Returns null when the token is unknown, expired or already used.
    /// </summary>
    Task<RotatedRefreshToken?> RotateAsync(string token, CancellationToken cancellationToken);

    Task RevokeAsync(string token, CancellationToken cancellationToken);
}

public sealed record RotatedRefreshToken(User User, IssuedRefreshToken RefreshToken);
