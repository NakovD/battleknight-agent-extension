using System.Net.Http.Headers;
using System.Net.Http.Json;
using BattleKnightExtensionAgent.Features.Auth;

namespace BattleKnightExtensionAgent.Tests.Infrastructure;

internal static class AuthApiClientExtensions
{
    public const string ValidPassword = "super-secret-passphrase";

    /// <summary>Every test gets its own email so tests sharing a factory never collide.</summary>
    public static string UniqueEmail() => $"knight-{Guid.NewGuid():N}@example.com";

    public static Task<HttpResponseMessage> RegisterAsync(
        this HttpClient client,
        string email,
        string password = ValidPassword) =>
        client.PostAsJsonAsync("/auth/register", new { email, password });

    public static Task<HttpResponseMessage> LoginAsync(
        this HttpClient client,
        string email,
        string password = ValidPassword) =>
        client.PostAsJsonAsync("/auth/login", new { email, password });

    public static async Task<AuthResponse> RegisterAndReadTokenAsync(
        this HttpClient client,
        string email,
        string password = ValidPassword)
    {
        var response = await client.RegisterAsync(email, password);
        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    public static Task<HttpResponseMessage> GetCurrentUserAsync(this HttpClient client, string? accessToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/auth/me");

        if (accessToken is not null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }

        return client.SendAsync(request);
    }
}
