import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/background/models/apiError";
import { createDuelsSettingsMessageHandler } from "./duelsSettingsMessageHandler";

const settings = {
	levelMin: 10,
	levelMax: 40,
	lootFilterEnabled: true,
	lootMax: 3_000_000,
	skipAllOrders: false,
	skipSpecificOrders: false,
	ordersToSkip: [],
	cooldownMs: 120_000,
	rankingOffset: 1900,
};

describe("createDuelsSettingsMessageHandler", () => {
	const service = { load: vi.fn(), save: vi.fn() };
	const handle = createDuelsSettingsMessageHandler(service);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("връща null за чужди съобщения", () => {
		expect(handle({ type: "AUTH_LOGIN" })).toBeNull();
		expect(handle({ type: "START_AGENT", payload: settings })).toBeNull();
		expect(handle({ type: "SETTINGS_SAVE", payload: { levelMin: -1 } })).toBeNull();
	});

	it("SETTINGS_LOAD връща настройките от услугата", async () => {
		service.load.mockResolvedValue(settings);

		expect(await handle({ type: "SETTINGS_LOAD" })).toEqual({
			ok: true,
			settings,
		});
	});

	it("SETTINGS_LOAD връща null, когато няма записани настройки", async () => {
		service.load.mockResolvedValue(null);

		expect(await handle({ type: "SETTINGS_LOAD" })).toEqual({
			ok: true,
			settings: null,
		});
	});

	it("SETTINGS_SAVE подава настройките на услугата", async () => {
		service.save.mockResolvedValue(settings);

		const reply = await handle({ type: "SETTINGS_SAVE", payload: settings });

		expect(service.save).toHaveBeenCalledWith(settings);
		expect(reply).toEqual({ ok: true, settings });
	});

	it("предава съобщението на ApiError към popup-а", async () => {
		service.load.mockRejectedValue(new ApiError("Could not reach the server."));

		expect(await handle({ type: "SETTINGS_LOAD" })).toEqual({
			ok: false,
			error: "Could not reach the server.",
		});
	});

	it("скрива детайлите на неочаквани грешки", async () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		service.load.mockRejectedValue(new Error("internal detail"));

		expect(await handle({ type: "SETTINGS_LOAD" })).toEqual({
			ok: false,
			error: "Something went wrong. Please try again.",
		});
		consoleError.mockRestore();
	});
});
