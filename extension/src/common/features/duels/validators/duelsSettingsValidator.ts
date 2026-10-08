import { boolean, number, object, string } from "zod";

export const duelsSettingsValidator = object({
	levelMin: number().min(0, "Minimum level must be a non-negative number"),
	levelMax: number().min(0, "Maximum level must be a non-negative number"),
	lootFilterEnabled: boolean(),
	lootMax: number().min(0, "Maximum loot must be a non-negative number"),
	skipAllOrders: boolean(),
	skipSpecificOrders: boolean(),
	/**
	 * Normalised rather than rejected: the engine compares these against trimmed
	 * names scraped from the page, so a stray space would quietly stop an order
	 * from ever being skipped. Rejecting instead would break on settings stored
	 * by an older version, which are read back through this schema.
	 */
	ordersToSkip: string()
		.array()
		.transform((orders) => orders.map((order) => order.trim()).filter(Boolean)),
	cooldownMs: number().min(0, "Cooldown must be a non-negative number"),
	rankingOffset: number().min(
		0,
		"Ranking offset must be a non-negative number",
	),
});
