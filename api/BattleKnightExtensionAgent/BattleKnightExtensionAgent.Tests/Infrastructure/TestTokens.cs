using System.Text;
using BattleKnightExtensionAgent.Features.Auth;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace BattleKnightExtensionAgent.Tests.Infrastructure;

/// <summary>Mints tokens directly, for cases the API itself never issues.</summary>
internal static class TestTokens
{
    public static string Create(
        ApiFactory factory,
        Guid subject,
        DateTime? expires = null,
        string? signingKey = null)
    {
        var options = factory.Services.GetRequiredService<IOptions<JwtOptions>>().Value;
        var expiresAt = expires ?? DateTime.UtcNow.AddMinutes(10);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey ?? options.Key));

        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = options.Issuer,
            Audience = options.Audience,
            // NotBefore and IssuedAt must not come after Expires, or the handler rejects
            // the descriptor itself before the API ever sees the token.
            NotBefore = expiresAt.AddMinutes(-10),
            IssuedAt = expiresAt.AddMinutes(-10),
            Expires = expiresAt,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256),
            Claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = subject.ToString(),
            },
        });
    }
}
