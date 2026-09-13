using System.Net;
using BattleKnightExtensionAgent.Tests.Infrastructure;

namespace BattleKnightExtensionAgent.Tests.Features;

public sealed class HealthEndpointTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Health_ReturnsOk()
    {
        var response = await factory.CreateClient().GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
