using System.Security.Claims;
using BattleKnightExtensionAgent.Common;
using BattleKnightExtensionAgent.Data;
using BattleKnightExtensionAgent.Data.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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
        group.MapPost("/refresh", RefreshAsync).WithName("Refresh");
        group.MapPost("/logout", LogoutAsync).WithName("Logout");
        group.MapGet("/me", GetCurrentUser).WithName("CurrentUser").RequireAuthorization();

        return app;
    }

    /// <summary>
    /// Trades a refresh token for a new pair. Deliberately unauthenticated: the whole
    /// point is to call it once the access token has expired.
    /// </summary>
    private static async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> RefreshAsync(
        RefreshRequest request,
        IRefreshTokenService refreshTokens,
        ITokenService tokenService,
        CancellationToken cancellationToken)
    {
        var rotated = await refreshTokens.RotateAsync(request.RefreshToken, cancellationToken);

        if (rotated is null)
        {
            return TypedResults.Unauthorized();
        }

        return TypedResults.Ok(CreateResponse(
            tokenService.CreateAccessToken(rotated.User),
            rotated.RefreshToken));
    }

    /// <summary>
    /// Always answers 204, whether or not the token was valid: there is nothing for
    /// the caller to do differently, and saying which tokens exist helps nobody.
    /// </summary>
    private static async Task<NoContent> LogoutAsync(
        RefreshRequest request,
        IRefreshTokenService refreshTokens,
        CancellationToken cancellationToken)
    {
        await refreshTokens.RevokeAsync(request.RefreshToken, cancellationToken);

        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok<AuthResponse>, Conflict<string>>> RegisterAsync(
        RegisterRequest request,
        AppDbContext db,
        IPasswordHasher<User> passwordHasher,
        ITokenService tokenService,
        IRefreshTokenService refreshTokens,
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

        return TypedResults.Ok(CreateResponse(
            tokenService.CreateAccessToken(user),
            await refreshTokens.IssueAsync(user, cancellationToken)));
    }

    private static async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> LoginAsync(
        LoginRequest request,
        AppDbContext db,
        IPasswordHasher<User> passwordHasher,
        ITokenService tokenService,
        IRefreshTokenService refreshTokens,
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

        return TypedResults.Ok(CreateResponse(
            tokenService.CreateAccessToken(user),
            await refreshTokens.IssueAsync(user, cancellationToken)));
    }

    private static AuthResponse CreateResponse(
        AccessToken accessToken,
        IssuedRefreshToken refreshToken) =>
        new(
            accessToken.Value,
            accessToken.ExpiresAt,
            refreshToken.Value,
            refreshToken.ExpiresAt);

    private static async Task<Results<Ok<UserInfoResponse>, UnauthorizedHttpResult>> GetCurrentUser(
        ClaimsPrincipal principal,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (principal.GetUserId() is not { } userId)
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
