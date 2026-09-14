using System.Net;
using System.Net.Http.Json;
using BattleKnightExtensionAgent.Data;
using BattleKnightExtensionAgent.Features.Auth;
using BattleKnightExtensionAgent.Features.Settings;
using BattleKnightExtensionAgent.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BattleKnightExtensionAgent.Tests.Features.Settings;

public sealed class SettingsEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string MissingField = "<missing>";

    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Get_BeforeAnythingIsSaved_ReturnsNotFound()
    {
        var token = await RegisterAsync();

        var response = await _client.GetSettingsAsync(token);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_ThenGet_RoundTripsEveryField()
    {
        var token = await RegisterAsync();
        var body = SettingsApiClientExtensions.ValidSettingsBody();

        var putResponse = await _client.PutSettingsAsync(token, body);
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var saved = await ReadSettingsAsync(await _client.GetSettingsAsync(token));

        Assert.Equal(10, saved.LevelMin);
        Assert.Equal(40, saved.LevelMax);
        Assert.True(saved.LootFilterEnabled);
        Assert.Equal(3_000_000L, saved.LootMax);
        Assert.True(saved.SkipAllOrders);
        Assert.True(saved.SkipSpecificOrders);
        Assert.Equal(new[] { "Order of the Dragon", "Knights Templar" }, saved.OrdersToSkip);
        Assert.Equal(120_000, saved.CooldownMs);
        Assert.Equal(1900, saved.RankingOffset);
    }

    [Fact]
    public async Task Put_UsesTheSameFieldNamesAsTheExtension()
    {
        var token = await RegisterAsync();

        var response = await _client.PutSettingsAsync(token, SettingsApiClientExtensions.ValidSettingsBody());
        var json = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();

        // Exactly the keys of the extension's DuelsSettings, plus the server's timestamp.
        var expectedKeys = SettingsApiClientExtensions.ValidSettingsBody().Keys
            .Append("updatedAt")
            .Order(StringComparer.Ordinal);

        Assert.Equal(expectedKeys, json!.Keys.Order(StringComparer.Ordinal));
    }

    [Fact]
    public async Task Put_WhenSettingsExist_ReplacesThemInsteadOfAddingAnother()
    {
        var token = await RegisterAsync();
        await _client.PutSettingsAsync(token, SettingsApiClientExtensions.ValidSettingsBody());

        var updated = SettingsApiClientExtensions.ValidSettingsBody();
        updated["levelMin"] = 0;
        updated["skipAllOrders"] = false;
        updated["ordersToSkip"] = new List<string>();
        var first = await ReadSettingsAsync(await _client.GetSettingsAsync(token));

        var response = await _client.PutSettingsAsync(token, updated);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var saved = await ReadSettingsAsync(await _client.GetSettingsAsync(token));
        Assert.Equal(0, saved.LevelMin);
        Assert.False(saved.SkipAllOrders);
        Assert.Empty(saved.OrdersToSkip);
        Assert.True(saved.UpdatedAt >= first.UpdatedAt);

        var userId = await GetUserIdAsync(token);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(1, await db.DuelsSettings.CountAsync(s => s.UserId == userId));
    }

    [Fact]
    public async Task Settings_AreIsolatedBetweenUsers()
    {
        var alice = await RegisterAsync();
        var bob = await RegisterAsync();

        await _client.PutSettingsAsync(alice, SettingsApiClientExtensions.ValidSettingsBody());

        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetSettingsAsync(bob)).StatusCode);

        var bobsSettings = SettingsApiClientExtensions.ValidSettingsBody();
        bobsSettings["levelMax"] = 999;
        await _client.PutSettingsAsync(bob, bobsSettings);

        var alicesSaved = await ReadSettingsAsync(await _client.GetSettingsAsync(alice));
        Assert.Equal(40, alicesSaved.LevelMax);
    }

    [Fact]
    public async Task Put_TrimsOrderNames()
    {
        var token = await RegisterAsync();
        var body = SettingsApiClientExtensions.ValidSettingsBody();
        body["ordersToSkip"] = new List<string> { "  Order of the Dragon  " };

        var saved = await ReadSettingsAsync(await _client.PutSettingsAsync(token, body));

        Assert.Equal(new[] { "Order of the Dragon" }, saved.OrdersToSkip);
    }

    [Fact]
    public async Task Put_AcceptsTheBoundaryValues()
    {
        var token = await RegisterAsync();
        var body = SettingsApiClientExtensions.ValidSettingsBody();
        body["levelMin"] = 0;
        body["levelMax"] = 0;
        body["lootMax"] = 0L;
        body["cooldownMs"] = 0;
        body["rankingOffset"] = 0;
        body["ordersToSkip"] = Enumerable
            .Range(0, DuelsSettingsRequest.MaxOrdersToSkip)
            .Select(i => new string('x', DuelsSettingsRequest.MaxOrderNameLength - 3) + i.ToString("000"))
            .ToList();

        var response = await _client.PutSettingsAsync(token, body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("levelMin", -1)]
    [InlineData("levelMax", -1)]
    [InlineData("levelMax", DuelsSettingsRequest.MaxLevel + 1)]
    [InlineData("lootMax", -1L)]
    [InlineData("cooldownMs", -1)]
    [InlineData("rankingOffset", -1)]
    [InlineData("levelMin", 3.5)]
    [InlineData("lootFilterEnabled", "yes")]
    [InlineData("ordersToSkip", null)]
    [InlineData("cooldownMs", MissingField)]
    [InlineData("skipAllOrders", MissingField)]
    public async Task Put_WithInvalidField_ReturnsBadRequest(string field, object? value)
    {
        var token = await RegisterAsync();
        var body = SettingsApiClientExtensions.ValidSettingsBody();

        if (value is MissingField)
        {
            body.Remove(field);
        }
        else
        {
            body[field] = value;
        }

        var response = await _client.PutSettingsAsync(token, body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_WithLevelMinAboveLevelMax_ReturnsBadRequest()
    {
        var token = await RegisterAsync();
        var body = SettingsApiClientExtensions.ValidSettingsBody();
        body["levelMin"] = 50;
        body["levelMax"] = 10;

        var response = await _client.PutSettingsAsync(token, body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Put_WithBlankOrderName_ReturnsBadRequest(string orderName)
    {
        var token = await RegisterAsync();
        var body = SettingsApiClientExtensions.ValidSettingsBody();
        body["ordersToSkip"] = new List<string> { "Valid Order", orderName };

        var response = await _client.PutSettingsAsync(token, body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_WithTooLongOrderName_ReturnsBadRequest()
    {
        var token = await RegisterAsync();
        var body = SettingsApiClientExtensions.ValidSettingsBody();
        body["ordersToSkip"] = new List<string> { new('x', DuelsSettingsRequest.MaxOrderNameLength + 1) };

        var response = await _client.PutSettingsAsync(token, body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_WithTooManyOrders_ReturnsBadRequest()
    {
        var token = await RegisterAsync();
        var body = SettingsApiClientExtensions.ValidSettingsBody();
        body["ordersToSkip"] = Enumerable
            .Range(0, DuelsSettingsRequest.MaxOrdersToSkip + 1)
            .Select(i => $"Order {i}")
            .ToList();

        var response = await _client.PutSettingsAsync(token, body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetSettingsAsync(accessToken: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Put_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PutSettingsAsync(accessToken: null, SettingsApiClientExtensions.ValidSettingsBody());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_WithValidTokenForUnknownUser_ReturnsUnauthorized()
    {
        var token = TestTokens.Create(factory, subject: Guid.CreateVersion7());

        var response = await _client.GetSettingsAsync(token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Put_WithValidTokenForUnknownUser_ReturnsUnauthorizedRatherThanFailing()
    {
        // Without the existence check this hits the foreign key and returns a 500.
        var token = TestTokens.Create(factory, subject: Guid.CreateVersion7());

        var response = await _client.PutSettingsAsync(token, SettingsApiClientExtensions.ValidSettingsBody());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeletingAUser_RemovesTheirSettings()
    {
        var token = await RegisterAsync();
        await _client.PutSettingsAsync(token, SettingsApiClientExtensions.ValidSettingsBody());
        var userId = await GetUserIdAsync(token);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // ExecuteDelete goes straight to the database, so this exercises the
        // foreign key's ON DELETE CASCADE rather than EF Core's in-memory cascade.
        await db.Users.Where(u => u.Id == userId).ExecuteDeleteAsync();

        Assert.False(await db.DuelsSettings.AnyAsync(s => s.UserId == userId));
    }

    private async Task<string> RegisterAsync() =>
        (await _client.RegisterAndReadTokenAsync(AuthApiClientExtensions.UniqueEmail())).AccessToken;

    private async Task<Guid> GetUserIdAsync(string accessToken)
    {
        var me = await (await _client.GetCurrentUserAsync(accessToken))
            .Content.ReadFromJsonAsync<UserInfoResponse>();

        return me!.Id;
    }

    private static async Task<DuelsSettingsResponse> ReadSettingsAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<DuelsSettingsResponse>())!;
    }
}
