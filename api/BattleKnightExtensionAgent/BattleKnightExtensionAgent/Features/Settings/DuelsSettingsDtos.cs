using System.ComponentModel.DataAnnotations;
using BattleKnightExtensionAgent.Data.Entities;

namespace BattleKnightExtensionAgent.Features.Settings;

/// <summary>
/// Property names match the extension's DuelsSettings exactly, so the extension can
/// send its settings object as-is (ASP.NET Core serialises JSON as camelCase).
///
/// The lower bounds mirror duelsSettingsValidator.ts. The upper bounds, the order
/// list limits and the level range check are server-side guards the extension's
/// schema doesn't have — the form's own controls already stay well inside them.
/// </summary>
public sealed record DuelsSettingsRequest : IValidatableObject
{
    public const int MaxLevel = 10_000;
    public const long MaxLoot = 1_000_000_000_000;
    public const int MaxCooldownMs = 24 * 60 * 60 * 1000;
    public const int MaxRankingOffset = 100_000;
    public const int MaxOrdersToSkip = 50;
    public const int MaxOrderNameLength = 100;

    [Range(0, MaxLevel)]
    public required int LevelMin { get; init; }

    [Range(0, MaxLevel)]
    public required int LevelMax { get; init; }

    public required bool LootFilterEnabled { get; init; }

    [Range(typeof(long), "0", "1000000000000")]
    public required long LootMax { get; init; }

    public required bool SkipAllOrders { get; init; }

    public required bool SkipSpecificOrders { get; init; }

    [Required]
    [MaxLength(MaxOrdersToSkip)]
    public required List<string> OrdersToSkip { get; init; }

    [Range(0, MaxCooldownMs)]
    public required int CooldownMs { get; init; }

    [Range(0, MaxRankingOffset)]
    public required int RankingOffset { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (LevelMin > LevelMax)
        {
            yield return new ValidationResult(
                "levelMin must not be greater than levelMax.",
                [nameof(LevelMin), nameof(LevelMax)]);
        }

        // Attributes can bound the list's length but not each element.
        if (OrdersToSkip.Any(order => string.IsNullOrWhiteSpace(order) || order.Trim().Length > MaxOrderNameLength))
        {
            yield return new ValidationResult(
                $"Every entry in ordersToSkip must be non-empty and at most {MaxOrderNameLength} characters.",
                [nameof(OrdersToSkip)]);
        }
    }

    public void ApplyTo(DuelsSettings settings)
    {
        settings.LevelMin = LevelMin;
        settings.LevelMax = LevelMax;
        settings.LootFilterEnabled = LootFilterEnabled;
        settings.LootMax = LootMax;
        settings.SkipAllOrders = SkipAllOrders;
        settings.SkipSpecificOrders = SkipSpecificOrders;
        // The engine compares these against trimmed order names scraped from the page.
        settings.OrdersToSkip = OrdersToSkip.Select(order => order.Trim()).ToList();
        settings.CooldownMs = CooldownMs;
        settings.RankingOffset = RankingOffset;
    }
}

public sealed record DuelsSettingsResponse(
    int LevelMin,
    int LevelMax,
    bool LootFilterEnabled,
    long LootMax,
    bool SkipAllOrders,
    bool SkipSpecificOrders,
    IReadOnlyList<string> OrdersToSkip,
    int CooldownMs,
    int RankingOffset,
    DateTimeOffset UpdatedAt)
{
    public static DuelsSettingsResponse From(DuelsSettings settings) => new(
        settings.LevelMin,
        settings.LevelMax,
        settings.LootFilterEnabled,
        settings.LootMax,
        settings.SkipAllOrders,
        settings.SkipSpecificOrders,
        settings.OrdersToSkip,
        settings.CooldownMs,
        settings.RankingOffset,
        settings.UpdatedAt);
}
