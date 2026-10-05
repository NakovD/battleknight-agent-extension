using System.Security.Cryptography;
using System.Text;
using BattleKnightExtensionAgent.Data;
using BattleKnightExtensionAgent.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BattleKnightExtensionAgent.Features.Auth;

public sealed class RefreshTokenService(
    AppDbContext db,
    IOptions<JwtOptions> options,
    TimeProvider timeProvider,
    ILogger<RefreshTokenService> logger) : IRefreshTokenService
{
    private const int TokenBytes = 32;

    private readonly JwtOptions _options = options.Value;

    public async Task<IssuedRefreshToken> IssueAsync(
        User user,
        CancellationToken cancellationToken)
    {
        var issued = await CreateAsync(user.Id, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return issued.Token;
    }

    public async Task<RotatedRefreshToken?> RotateAsync(
        string token,
        CancellationToken cancellationToken)
    {
        var hash = Hash(token);
        var stored = await db.RefreshTokens.SingleOrDefaultAsync(
            t => t.TokenHash == hash,
            cancellationToken);

        if (stored is null)
        {
            return null;
        }

        var now = timeProvider.GetUtcNow();

        // A token that was already rotated is being presented again: either it leaked,
        // or a stale client is retrying. Either way the chain can no longer be trusted,
        // so every token this user holds is revoked and they have to sign in again.
        if (stored.RevokedAt is not null)
        {
            logger.LogWarning(
                "Refresh token {TokenId} for user {UserId} was reused; revoking all of their tokens.",
                stored.Id,
                stored.UserId);

            await RevokeAllForUserAsync(stored.UserId, now, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);

            return null;
        }

        if (!stored.IsActive(now))
        {
            return null;
        }

        var user = await db.Users.FindAsync([stored.UserId], cancellationToken);

        if (user is null)
        {
            return null;
        }

        var replacement = await CreateAsync(user.Id, cancellationToken);

        stored.RevokedAt = now;
        stored.ReplacedByTokenId = replacement.Id;

        await db.SaveChangesAsync(cancellationToken);

        return new RotatedRefreshToken(user, replacement.Token);
    }

    public async Task RevokeAsync(string token, CancellationToken cancellationToken)
    {
        var hash = Hash(token);
        var stored = await db.RefreshTokens.SingleOrDefaultAsync(
            t => t.TokenHash == hash,
            cancellationToken);

        if (stored is null || stored.RevokedAt is not null)
        {
            return;
        }

        stored.RevokedAt = timeProvider.GetUtcNow();
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<(Guid Id, IssuedRefreshToken Token)> CreateAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var value = Base64UrlEncode(RandomNumberGenerator.GetBytes(TokenBytes));
        var expiresAt = timeProvider.GetUtcNow().AddDays(_options.RefreshTokenDays);

        var entity = new RefreshToken
        {
            UserId = userId,
            TokenHash = Hash(value),
            ExpiresAt = expiresAt,
            CreatedAt = timeProvider.GetUtcNow(),
        };

        await db.RefreshTokens.AddAsync(entity, cancellationToken);

        return (entity.Id, new IssuedRefreshToken(value, expiresAt));
    }

    private async Task RevokeAllForUserAsync(
        Guid userId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var active = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in active)
        {
            token.RevokedAt = now;
        }
    }

    /// <summary>
    /// A plain SHA-256, unlike passwords: the token is 32 random bytes, so there is
    /// nothing to guess and no need for a slow hash.
    /// </summary>
    private static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
