export const domDuelsEngineConstants = {
	rankingUrl: "/highscore/",
	duelUrl: "/duel/duel/?enemyID=",
	/** Where the game lands when it refuses a duel. */
	errorPath: "/common/error",
};

/**
 * Columns of the ranking table, by the class the game puts on each cell.
 *
 * Verified against a live ranking page:
 *   01 rank | 02 icon | 03 name | 04 level | 05 loot | 06 fights | 07 wins | 08 losses
 *
 * These were previously read one column to the right, so every knight's level came
 * from the column after it and no one ever matched a level filter.
 */
export const rankingTableColumns = {
	playerName: "td.playerName",
	level: "td.highscore04",
	loot: "td.highscore05",
} as const;

/**
 * The profile link inside a name cell.
 *
 * Matched by href rather than by its id: the game puts id="playerLink" on every
 * row, so the id is not unique. Scoped querySelector still resolves that
 * correctly in the browser, but relying on a duplicated id is asking for
 * trouble — and it hides real bugs in tests, where jsdom returns the document's
 * first match instead of the row's.
 */
export const profileLinkSelector = 'a[href*="/profile/"]';
