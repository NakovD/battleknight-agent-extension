using System.Net;
using System.Net.Http.Json;
using BattleKnightExtensionAgent.Features.Auth;
using BattleKnightExtensionAgent.Tests.Infrastructure;

namespace BattleKnightExtensionAgent.Tests.Features.Auth;

public sealed class RegisterEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Register_WithValidInput_ReturnsAccessToken()
    {
        var response = await _client.RegisterAsync(AuthApiClientExtensions.UniqueEmail());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.False(string.IsNullOrWhiteSpace(body!.AccessToken));
        Assert.True(body.ExpiresAt > DateTimeOffset.UtcNow);
    }

    [Fact]
    public async Task Register_StoresEmailTrimmedAndLowercase()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        var token = await _client.RegisterAndReadTokenAsync($"  {email.ToUpperInvariant()}  ");

        var me = await (await _client.GetCurrentUserAsync(token.AccessToken))
            .Content.ReadFromJsonAsync<UserInfoResponse>();

        Assert.Equal(email, me!.Email);
    }

    [Fact]
    public async Task Register_WithExistingEmail_ReturnsConflict()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        await _client.RegisterAndReadTokenAsync(email);

        var response = await _client.RegisterAsync(email);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithExistingEmailInDifferentCase_ReturnsConflict()
    {
        var email = AuthApiClientExtensions.UniqueEmail();
        await _client.RegisterAndReadTokenAsync(email);

        var response = await _client.RegisterAsync(email.ToUpperInvariant());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Theory]
    [InlineData("not-an-email", AuthApiClientExtensions.ValidPassword)]
    [InlineData("", AuthApiClientExtensions.ValidPassword)]
    [InlineData("knight@example.com", "short")]
    [InlineData("knight@example.com", "")]
    public async Task Register_WithInvalidInput_ReturnsValidationProblem(string email, string password)
    {
        var response = await _client.RegisterAsync(email, password);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
