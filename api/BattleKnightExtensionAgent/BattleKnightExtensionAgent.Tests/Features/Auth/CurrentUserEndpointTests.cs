using System.Net;
using System.Net.Http.Json;
using System.Text;
using BattleKnightExtensionAgent.Features.Auth;
using BattleKnightExtensionAgent.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace BattleKnightExtensionAgent.Tests.Features.Auth;

public sealed class CurrentUserEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private JwtOptions JwtOptions => factory.Services.GetRequiredService<IOptions<JwtOptions>>().Value;

    [Fact]
    public async Task Me_WithValidToken_ReturnsTheAuthenticatedUser()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        var token = await _client.RegisterAndReadTokenAsync(email);

        var response = await _client.GetCurrentUserAsync(token.AccessToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var me = await response.Content.ReadFromJsonAsync<UserInfoResponse>();
        Assert.Equal(email, me!.Email);
        Assert.NotEqual(Guid.Empty, me.Id);
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetCurrentUserAsync(accessToken: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithTamperedToken_ReturnsUnauthorized()
    {
        var token = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());

        var response = await _client.GetCurrentUserAsync(token.AccessToken + "x");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithTokenSignedByAnotherKey_ReturnsUnauthorized()
    {
        var token = CreateToken(
            subject: Guid.CreateVersion7(),
            signingKey: "some-other-signing-key-that-the-api-does-not-trust-0123");

        var response = await _client.GetCurrentUserAsync(token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithExpiredToken_ReturnsUnauthorized()
    {
        var registered = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());
        var userId = await GetUserIdAsync(registered.AccessToken);

        // Well past the API's 30 second clock skew allowance.
        var token = CreateToken(subject: userId, expires: DateTime.UtcNow.AddMinutes(-5));

        var response = await _client.GetCurrentUserAsync(token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithValidTokenForUnknownUser_ReturnsUnauthorized()
    {
        // Correctly signed, but for a user that doesn't exist (e.g. deleted since issuing).
        var token = CreateToken(subject: Guid.CreateVersion7());

        var response = await _client.GetCurrentUserAsync(token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task IssuedToken_CarriesExpectedIssuerAudienceAndClaims()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        var registered = await _client.RegisterAndReadTokenAsync(email);
        var userId = await GetUserIdAsync(registered.AccessToken);

        var jwt = new JsonWebTokenHandler().ReadJsonWebToken(registered.AccessToken);

        Assert.Equal(JwtOptions.Issuer, jwt.Issuer);
        Assert.Contains(JwtOptions.Audience, jwt.Audiences);
        Assert.Equal(userId.ToString(), jwt.Subject);
        Assert.Equal(email, jwt.GetClaim(JwtRegisteredClaimNames.Email).Value);
        Assert.False(string.IsNullOrWhiteSpace(jwt.Id));

        // JWT exp has one-second precision.
        Assert.Equal(
            registered.ExpiresAt.ToUnixTimeSeconds(),
            new DateTimeOffset(jwt.ValidTo, TimeSpan.Zero).ToUnixTimeSeconds());
    }

    private async Task<Guid> GetUserIdAsync(string accessToken)
    {
        var me = await (await _client.GetCurrentUserAsync(accessToken))
            .Content.ReadFromJsonAsync<UserInfoResponse>();

        return me!.Id;
    }

    private string CreateToken(Guid subject, DateTime? expires = null, string? signingKey = null)
    {
        var options = JwtOptions;
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
