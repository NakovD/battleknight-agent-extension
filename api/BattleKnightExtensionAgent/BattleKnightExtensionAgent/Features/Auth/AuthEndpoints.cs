using System.Security.Claims;
using BattleKnightExtensionAgent.Data;
using BattleKnightExtensionAgent.Data.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;

namespace BattleKnightExtensionAgent.Features.Auth;

public static class AuthEndpoints
{
    /// <summary>
    /// Used only to burn comparable CPU time when an email isn't registered, so
    /// login response times don't reveal which emails exist.
    /// </summary>
    private static readonly User TimingDummyUser = new()
    {
        Email = "dummy@invalid.local",
        PasswordHash = string.Empty,
    };

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth").WithTags("Auth");

        group.MapPost("/register", RegisterAsync).WithName("Register");
        group.MapPost("/login", LoginAsync).WithName("Login");
        group.MapGet("/me", GetCurrentUser).WithName("CurrentUser").RequireAuthorization();

        return app;
    }

    private static async Task<Results<Ok<AuthResponse>, Conflict<string>>> RegisterAsync(
        RegisterRequest request,
        AppDbContext db,
        IPasswordHasher<User> passwordHasher,
        ITokenService tokenService,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);

        if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            return TypedResults.Conflict("A user with this email already exists.");
        }

        var user = new User { Email = email, PasswordHash = string.Empty };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        var token = tokenService.CreateAccessToken(user);

        return TypedResults.Ok(new AuthResponse(token.Value, token.ExpiresAt));
    }

    private static async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> LoginAsync(
        LoginRequest request,
        AppDbContext db,
        IPasswordHasher<User> passwordHasher,
        ITokenService tokenService,
        CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user is null)
        {
            passwordHasher.HashPassword(TimingDummyUser, request.Password);
            return TypedResults.Unauthorized();
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (verification == PasswordVerificationResult.Failed)
        {
            return TypedResults.Unauthorized();
        }

        // The hashing parameters have since been strengthened — upgrade the stored hash.
        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
            await db.SaveChangesAsync(cancellationToken);
        }

        var token = tokenService.CreateAccessToken(user);

        return TypedResults.Ok(new AuthResponse(token.Value, token.ExpiresAt));
    }

    private static async Task<Results<Ok<UserInfoResponse>, UnauthorizedHttpResult>> GetCurrentUser(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub), out var userId))
        {
            return TypedResults.Unauthorized();
        }

        var user = await db.Users.FindAsync([userId], cancellationToken);

        return user is null
            ? TypedResults.Unauthorized()
            : TypedResults.Ok(new UserInfoResponse(user.Id, user.Email, user.CreatedAt));
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
