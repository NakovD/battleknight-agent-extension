using System.Net;
using System.Net.Http.Json;
using BattleKnightExtensionAgent.Data;
using BattleKnightExtensionAgent.Data.Entities;
using BattleKnightExtensionAgent.Features.Auth;
using BattleKnightExtensionAgent.Tests.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace BattleKnightExtensionAgent.Tests.Features.Auth;

public sealed class LoginEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Login_WithCorrectCredentials_ReturnsAccessToken()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        await _client.RegisterAndReadTokenAsync(email);

        var response = await _client.LoginAsync(email);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.False(string.IsNullOrWhiteSpace(body!.AccessToken));
    }

    [Fact]
    public async Task Login_IsCaseInsensitiveOnEmail()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        await _client.RegisterAndReadTokenAsync(email);

        var response = await _client.LoginAsync(email.ToUpperInvariant());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        await _client.RegisterAndReadTokenAsync(email);

        var response = await _client.LoginAsync(email, "a-completely-wrong-password");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithUnknownEmail_ReturnsUnauthorized()
    {
        var response = await _client.LoginAsync(AuthApiClientExtensions.UniqueEmail());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithLegacyPasswordHash_UpgradesStoredHash()
    {
        var email = AuthApiClientExtensions.UniqueEmail();

        // Seed a user hashed with the older V2 format, as if created before the
        // hashing parameters were strengthened.
        var legacyHasher = new PasswordHasher<User>(Options.Create(new PasswordHasherOptions
        {
            CompatibilityMode = PasswordHasherCompatibilityMode.IdentityV2,
        }));

        string legacyHash;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var user = new User { Email = email, PasswordHash = string.Empty };
            user.PasswordHash = legacyHash = legacyHasher.HashPassword(user, AuthApiClientExtensions.ValidPassword);
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        var response = await _client.LoginAsync(email);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var stored = await db.Users.SingleAsync(u => u.Email == email);

            Assert.NotEqual(legacyHash, stored.PasswordHash);

            // The upgraded hash must still verify, and no longer need rehashing.
            var currentHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
            Assert.Equal(
                PasswordVerificationResult.Success,
                currentHasher.VerifyHashedPassword(stored, stored.PasswordHash, AuthApiClientExtensions.ValidPassword));
        }
    }
}
