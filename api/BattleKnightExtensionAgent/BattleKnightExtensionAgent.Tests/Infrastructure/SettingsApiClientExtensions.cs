using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace BattleKnightExtensionAgent.Tests.Infrastructure;

internal static class SettingsApiClientExtensions
{
    /// <summary>
    /// A valid body shaped exactly like the extension's DuelsSettings object, as a
    /// dictionary so tests can tweak or remove individual fields.
    /// </summary>
    public static Dictionary<string, object?> ValidSettingsBody() => new()
    {
        ["levelMin"] = 10,
        ["levelMax"] = 40,
        ["lootFilterEnabled"] = true,
        ["lootMax"] = 3_000_000L,
        ["skipAllOrders"] = true,
        ["skipSpecificOrders"] = true,
        ["ordersToSkip"] = new List<string> { "Order of the Dragon", "Knights Templar" },
        ["cooldownMs"] = 120_000,
        ["rankingOffset"] = 1900,
    };

    public static Task<HttpResponseMessage> GetSettingsAsync(this HttpClient client, string? accessToken) =>
        client.SendAsync(CreateRequest(HttpMethod.Get, accessToken));

    public static Task<HttpResponseMessage> PutSettingsAsync(
        this HttpClient client,
        string? accessToken,
        object body)
    {
        var request = CreateRequest(HttpMethod.Put, accessToken);
        request.Content = JsonContent.Create(body);

        return client.SendAsync(request);
    }

    private static HttpRequestMessage CreateRequest(HttpMethod method, string? accessToken)
    {
        var request = new HttpRequestMessage(method, "/settings");

        if (accessToken is not null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }

        return request;
    }
}
