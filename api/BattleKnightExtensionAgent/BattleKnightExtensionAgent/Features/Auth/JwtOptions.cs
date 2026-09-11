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
    /// Long-lived for now because there are no refresh tokens yet; shorten this
    /// once refresh tokens land.
    /// </summary>
    [Range(1, 60 * 24 * 30)]
    public int ExpiryMinutes { get; init; } = 60 * 24 * 7;
}
