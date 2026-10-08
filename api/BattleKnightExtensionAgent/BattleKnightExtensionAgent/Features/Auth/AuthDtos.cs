using System.ComponentModel.DataAnnotations;

namespace BattleKnightExtensionAgent.Features.Auth;

public sealed record RegisterRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public required string Email { get; init; }

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public required string Password { get; init; }
}

public sealed record LoginRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public required string Email { get; init; }

    [Required]
    [MaxLength(128)]
    public required string Password { get; init; }
}

public sealed record RefreshRequest
{
    [Required]
    [MaxLength(256)]
    public required string RefreshToken { get; init; }
}

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);

public sealed record UserInfoResponse(Guid Id, string Email, DateTimeOffset CreatedAt);
