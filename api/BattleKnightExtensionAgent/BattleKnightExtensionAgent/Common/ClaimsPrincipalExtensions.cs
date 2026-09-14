using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace BattleKnightExtensionAgent.Common;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// The authenticated user's id from the token's <c>sub</c> claim, or null when it
    /// is missing or malformed.
    /// </summary>
    public static Guid? GetUserId(this ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub), out var userId)
            ? userId
            : null;
}
