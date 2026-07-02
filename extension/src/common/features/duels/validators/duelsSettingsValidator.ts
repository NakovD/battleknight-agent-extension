import { boolean, number, object, string } from "zod";

export const duelsSettingsValidator = object({
	levelMin: number().min(1, "Minimum level must be at least 1"),
	levelMax: number().min(1, "Maximum level must be at least 1"),
	lootFilterEnabled: boolean(),
	lootMax: number().min(0, "Maximum loot must be a non-negative number"),
	skipAllOrders: boolean(),
	skipSpecificOrders: boolean(),
	ordersToSkip: string().array(),
	cooldownMs: number().min(0, "Cooldown must be a non-negative number"),
	rankingOffset: number().min(
		0,
		"Ranking offset must be a non-negative number",
	),
});
