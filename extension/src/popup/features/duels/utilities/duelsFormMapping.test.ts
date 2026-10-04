import { describe, expect, it } from "vitest";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { mapFormToSettings, mapSettingsToForm } from "./duelsFormMapping";

const settings = {
	levelMin: 10,
	levelMax: 40,
	lootFilterEnabled: true,
	lootMax: 3_000_000,
	skipAllOrders: true,
	skipSpecificOrders: true,
	ordersToSkip: ["Order of the Dragon"],
	cooldownMs: 300_000,
	rankingOffset: 1900,
};

describe("duels form mapping", () => {
	it("възстановява формата от записани настройки", () => {
		expect(mapSettingsToForm(settings)).toEqual({
			maxLoot: 3_000_000,
			skipWithOrder: true,
			skipSpecificOrders: true,
			specificOrders: [{ name: "Order of the Dragon" }],
			levels: [10, 40],
			page: { label: "1901-2000", value: "19" },
			cooldownMinutes: 5,
		});
	});

	it("връща същите настройки след път през формата", () => {
		expect(mapFormToSettings(mapSettingsToForm(settings))).toEqual(settings);
	});

	it("пада на първата страница при непознат offset", () => {
		const restored = mapSettingsToForm({ ...settings, rankingOffset: 12_345 });

		expect(restored.page).toEqual(duelsFormDefaultValues.page);
	});

	it("закръгля cooldown до цели минути", () => {
		expect(mapSettingsToForm({ ...settings, cooldownMs: 90_000 }).cooldownMinutes).toBe(2);
	});

	it("вдига cooldown под минута до една, защото формата иска поне толкова", () => {
		expect(mapSettingsToForm({ ...settings, cooldownMs: 0 }).cooldownMinutes).toBe(1);
	});
});
