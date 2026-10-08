using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using BattleKnightExtensionAgent.Data;
using BattleKnightExtensionAgent.Features.Auth;
using BattleKnightExtensionAgent.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BattleKnightExtensionAgent.Tests.Features.Auth;

public sealed class RefreshEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Register_ReturnsARefreshTokenAlongsideTheAccessToken()
    {
        var tokens = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());

        Assert.False(string.IsNullOrWhiteSpace(tokens.RefreshToken));
        Assert.NotEqual(tokens.AccessToken, tokens.RefreshToken);
        Assert.True(tokens.RefreshTokenExpiresAt > tokens.ExpiresAt);
    }

    [Fact]
    public async Task Refresh_ReturnsAWorkingAccessTokenForTheSameUser()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        var original = await _client.RegisterAndReadTokenAsync(email);

        var refreshed = await ReadAuthAsync(await _client.RefreshAsync(original.RefreshToken));

        Assert.NotEqual(original.AccessToken, refreshed.AccessToken);

        var me = await (await _client.GetCurrentUserAsync(refreshed.AccessToken))
            .Content.ReadFromJsonAsync<UserInfoResponse>();
        Assert.Equal(email, me!.Email);
    }

    [Fact]
    public async Task Refresh_RotatesTheRefreshToken()
    {
        var original = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());

        var refreshed = await ReadAuthAsync(await _client.RefreshAsync(original.RefreshToken));

        Assert.NotEqual(original.RefreshToken, refreshed.RefreshToken);
        // The new one works...
        Assert.Equal(HttpStatusCode.OK, (await _client.RefreshAsync(refreshed.RefreshToken)).StatusCode);
    }

    [Fact]
    public async Task Refresh_WithAnUnknownToken_ReturnsUnauthorized()
    {
        var response = await _client.RefreshAsync("not-a-real-token");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_WithAnExpiredToken_ReturnsUnauthorized()
    {
        var tokens = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());

        // Past the 30 day default.
        factory.Time.Advance(TimeSpan.FromDays(31));

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await _client.RefreshAsync(tokens.RefreshToken)).StatusCode);
    }

    [Fact]
    public async Task ReusingARotatedToken_RevokesTheWholeChain()
    {
        var original = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());
        var refreshed = await ReadAuthAsync(await _client.RefreshAsync(original.RefreshToken));

        // The old token shows up again: either it leaked or a stale client retried.
        var reuse = await _client.RefreshAsync(original.RefreshToken);

        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);
        // ...and the token that replaced it is no longer accepted either, so whoever
        // holds the stolen copy and the real client both have to sign in again.
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await _client.RefreshAsync(refreshed.RefreshToken)).StatusCode);
    }

    [Fact]
    public async Task Logout_InvalidatesTheRefreshToken()
    {
        var tokens = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());

        var logout = await _client.LogoutAsync(tokens.RefreshToken);

        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            (await _client.RefreshAsync(tokens.RefreshToken)).StatusCode);
    }

    [Fact]
    public async Task Logout_WithAnUnknownToken_StillReturnsNoContent()
    {
        // Telling the caller which tokens exist would help nobody but an attacker.
        var response = await _client.LogoutAsync("not-a-real-token");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task TheRefreshTokenItselfIsNeverStored()
    {
        var tokens = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await db.RefreshTokens.Select(t => t.TokenHash).ToListAsync();

        Assert.DoesNotContain(tokens.RefreshToken, stored);
        Assert.Contains(
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(tokens.RefreshToken))),
            stored);
    }

    [Fact]
    public async Task DeletingAUser_RemovesTheirRefreshTokens()
    {
        var tokens = await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail());
        var me = await (await _client.GetCurrentUserAsync(tokens.AccessToken))
            .Content.ReadFromJsonAsync<UserInfoResponse>();

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Users.Where(u => u.Id == me!.Id).ExecuteDeleteAsync();

        Assert.False(await db.RefreshTokens.AnyAsync(t => t.UserId == me!.Id));
    }

    private static async Task<AuthResponse> ReadAuthAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
    }
}
