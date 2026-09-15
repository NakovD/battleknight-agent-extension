using BattleKnightExtensionAgent.Data.Entities;

namespace BattleKnightExtensionAgent.Features.Auth;

public interface ITokenService
{
    AccessToken CreateAccessToken(User user);
}

public readonly record struct AccessToken(string Value, DateTimeOffset ExpiresAt);
