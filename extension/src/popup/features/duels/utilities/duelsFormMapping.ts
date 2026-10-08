import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { duelsFormPagesOptions } from "@/popup/features/duels/constants/duelsFormPagesOptions";
import type { DuelsForm } from "@/popup/features/duels/models/duelsForm";

export const RANKING_PAGE_SIZE = 100;

const MILLISECONDS_PER_MINUTE = 60_000;

export const mapFormToSettings = (values: DuelsForm): DuelsSettings => ({
	levelMin: values.levels[0],
	levelMax: values.levels[1],
	lootFilterEnabled: true,
	lootMax: values.maxLoot,
	skipAllOrders: values.skipWithOrder,
	skipSpecificOrders: values.skipSpecificOrders,
	// Trimmed to match the names scraped from the page, which the engine trims
	// too. The API trims on save as well, so a signed-in user got this for free
	// while a signed-out one silently never matched.
	ordersToSkip: values.specificOrders.map((o) => o.name.trim()),
	cooldownMs: values.cooldownMinutes * MILLISECONDS_PER_MINUTE,
	rankingOffset: Number(values.page.value) * RANKING_PAGE_SIZE,
});

/** Fills the form from settings saved on the server. */
export const mapSettingsToForm = (settings: DuelsSettings): DuelsForm => ({
	maxLoot: settings.lootMax,
	skipWithOrder: settings.skipAllOrders,
	skipSpecificOrders: settings.skipSpecificOrders,
	specificOrders: settings.ordersToSkip.map((name) => ({ name })),
	levels: [settings.levelMin, settings.levelMax],
	page:
		duelsFormPagesOptions.find(
			(option) => Number(option.value) * RANKING_PAGE_SIZE === settings.rankingOffset,
		) ?? duelsFormDefaultValues.page,
	// The form's slider is in whole minutes and requires at least one, while the
	// API accepts any non-negative number of milliseconds.
	cooldownMinutes: Math.max(
		1,
		Math.round(settings.cooldownMs / MILLISECONDS_PER_MINUTE),
	),
});
