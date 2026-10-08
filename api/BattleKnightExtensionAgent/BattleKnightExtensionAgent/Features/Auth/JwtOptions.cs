using System.ComponentModel.DataAnnotations;

namespace BattleKnightExtensionAgent.Features.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>
    /// Signing key. Never committed — supplied via user-secrets in development
    /// and environment variables elsewhere.
    /// </summary>
    [Required]
    [MinLength(32)]
    public string Key { get; init; } = string.Empty;

    [Required]
    public string Issuer { get; init; } = string.Empty;

    [Required]
    public string Audience { get; init; } = string.Empty;

    /// <summary>
    /// Short by design: an access token can't be revoked, so it is the refresh
    /// token's lifetime that decides how long a session lasts.
    /// </summary>
    [Range(1, 60 * 24)]
    public int AccessTokenMinutes { get; init; } = 15;

    [Range(1, 365)]
    public int RefreshTokenDays { get; init; } = 30;
}
