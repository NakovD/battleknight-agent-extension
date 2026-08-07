import { describe, expect, it } from "vitest";
import { duelsSettingsValidator } from "./duelsSettingsValidator";

const validSettings = {
	levelMin: 5,
	levelMax: 30,
	lootFilterEnabled: true,
	lootMax: 3_000_000,
	skipAllOrders: false,
	skipSpecificOrders: false,
	ordersToSkip: [],
	cooldownMs: 120_000,
	rankingOffset: 0,
};

describe("duelsSettingsValidator", () => {
	it("приема валиден пълен обект", () => {
		expect(duelsSettingsValidator.safeParse(validSettings).success).toBe(true);
	});

	it("приема levelMin: 0 (означава без долна граница)", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			levelMin: 0,
		});

		expect(result.success).toBe(true);
	});

	it("приема levelMax: 0", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			levelMax: 0,
		});

		expect(result.success).toBe(true);
	});

	it("отхвърля отрицателен levelMin", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			levelMin: -1,
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля отрицателен levelMax", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			levelMax: -1,
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля отрицателен lootMax", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			lootMax: -1,
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля отрицателен cooldownMs", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			cooldownMs: -1,
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля отрицателен rankingOffset", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			rankingOffset: -1,
		});

		expect(result.success).toBe(false);
	});

	it("приема rankingOffset: 0", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			rankingOffset: 0,
		});

		expect(result.success).toBe(true);
	});

	it("приема ordersToSkip с няколко имена на ордени", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			skipAllOrders: true,
			skipSpecificOrders: true,
			ordersToSkip: ["Орден А", "Орден Б"],
		});

		expect(result.success).toBe(true);
	});

	it("отхвърля ordersToSkip с не-текстови елементи", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			ordersToSkip: [1, 2],
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля липсващо задължително поле", () => {
		const { levelMin, ...withoutLevelMin } = validSettings;

		const result = duelsSettingsValidator.safeParse(withoutLevelMin);

		expect(result.success).toBe(false);
	});

	it("отхвърля грешен тип за булево поле", () => {
		const result = duelsSettingsValidator.safeParse({
			...validSettings,
			lootFilterEnabled: "yes",
		});

		expect(result.success).toBe(false);
	});
});
