using System.Security.Claims;
using BattleKnightExtensionAgent.Common;
using BattleKnightExtensionAgent.Data;
using BattleKnightExtensionAgent.Data.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace BattleKnightExtensionAgent.Features.Settings;

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/settings")
            .WithTags("Settings")
            .RequireAuthorization();

        group.MapGet("", GetAsync).WithName("GetDuelsSettings");
        group.MapPut("", SaveAsync).WithName("SaveDuelsSettings");

        return app;
    }

    /// <summary>
    /// 404 when the user hasn't saved settings yet — the extension then falls back to
    /// its own defaults.
    /// </summary>
    private static async Task<Results<Ok<DuelsSettingsResponse>, NotFound, UnauthorizedHttpResult>> GetAsync(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (principal.GetUserId() is not { } userId)
        {
            return TypedResults.Unauthorized();
        }

        var settings = await db.DuelsSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (settings is not null)
        {
            return TypedResults.Ok(DuelsSettingsResponse.From(settings));
        }

        // Only reached on the not-found path: tell "no settings yet" apart from a
        // validly signed token for a user that no longer exists, as /auth/me does.
        return await db.Users.AnyAsync(u => u.Id == userId, cancellationToken)
            ? TypedResults.NotFound()
            : TypedResults.Unauthorized();
    }

    /// <summary>Creates the user's settings, or replaces them entirely if they exist.</summary>
    private static async Task<Results<Ok<DuelsSettingsResponse>, UnauthorizedHttpResult>> SaveAsync(
        DuelsSettingsRequest request,
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (principal.GetUserId() is not { } userId)
        {
            return TypedResults.Unauthorized();
        }

        var settings = await db.DuelsSettings.SingleOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (settings is null)
        {
            // Without this, a token for a deleted user would hit the foreign key and
            // surface as a 500 instead of a 401.
            if (!await db.Users.AnyAsync(u => u.Id == userId, cancellationToken))
            {
                return TypedResults.Unauthorized();
            }

            settings = new DuelsSettings { UserId = userId };
            db.DuelsSettings.Add(settings);
        }

        request.ApplyTo(settings);
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return TypedResults.Ok(DuelsSettingsResponse.From(settings));
    }
}
