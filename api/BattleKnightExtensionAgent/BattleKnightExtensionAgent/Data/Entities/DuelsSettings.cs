namespace BattleKnightExtensionAgent.Data.Entities;

/// <summary>
/// A user's saved duels configuration. Mirrors the extension's DuelsSettings
/// (common/features/duels/validators/duelsSettingsValidator.ts) field for field.
/// </summary>
public sealed class DuelsSettings
{
    /// <summary>
    /// Both the primary key and the foreign key to <see cref="User"/>, so the database
    /// itself guarantees at most one settings row per user.
    /// </summary>
    public Guid UserId { get; init; }

    public int LevelMin { get; set; }

    public int LevelMax { get; set; }

    public bool LootFilterEnabled { get; set; }

    public long LootMax { get; set; }

    public bool SkipAllOrders { get; set; }

    public bool SkipSpecificOrders { get; set; }

    public List<string> OrdersToSkip { get; set; } = [];

    public int CooldownMs { get; set; }

    public int RankingOffset { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
