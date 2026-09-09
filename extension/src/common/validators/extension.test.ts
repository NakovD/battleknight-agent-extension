import { describe, expect, it } from "vitest";
import { boolean, number, object } from "zod";
import {
	getExtensionMessageResponseSchema,
	getExtensionMessageSchema,
	getExtensionStateSchema,
} from "./extension";

// Проста settings схема за тестовете — не ни трябва реалната duels схема тук,
// само да проверим, че генеричният wire protocol пренася каквото му подадем.
const testSettingsSchema = object({
	levelMin: number(),
	enabled: boolean(),
});

const validSettings = { levelMin: 5, enabled: true };

describe("getExtensionStateSchema", () => {
	const schema = getExtensionStateSchema(testSettingsSchema);

	it("приема състояние с реални settings", () => {
		const result = schema.safeParse({
			status: "running",
			errorMessage: null,
			settings: validSettings,
		});

		expect(result.success).toBe(true);
	});

	it("пази settings непокътнати след parse (regression за изгубени settings)", () => {
		const result = schema.safeParse({
			status: "running",
			errorMessage: null,
			settings: validSettings,
		});

		expect(result.success && result.data.settings).toEqual(validSettings);
	});

	it("приема settings: null", () => {
		const result = schema.safeParse({
			status: "idle",
			errorMessage: null,
			settings: null,
		});

		expect(result.success).toBe(true);
	});

	it("отхвърля невалидна стойност за status", () => {
		const result = schema.safeParse({
			status: "paused",
			errorMessage: null,
			settings: null,
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля липсващо settings поле", () => {
		const result = schema.safeParse({
			status: "idle",
			errorMessage: null,
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля settings, който не съвпада с подадената схема", () => {
		const result = schema.safeParse({
			status: "idle",
			errorMessage: null,
			settings: { levelMin: "not a number", enabled: true },
		});

		expect(result.success).toBe(false);
	});
});

describe("getExtensionMessageSchema", () => {
	const schema = getExtensionMessageSchema(testSettingsSchema);

	it("приема START_AGENT с валиден payload", () => {
		const result = schema.safeParse({
			type: "START_AGENT",
			payload: validSettings,
		});

		expect(result.success).toBe(true);
	});

	it("отхвърля START_AGENT с невалиден payload", () => {
		const result = schema.safeParse({
			type: "START_AGENT",
			payload: { levelMin: "5" },
		});

		expect(result.success).toBe(false);
	});

	it("приема STOP_AGENT без payload", () => {
		const result = schema.safeParse({ type: "STOP_AGENT" });

		expect(result.success).toBe(true);
	});

	it("приема GET_STATUS без payload", () => {
		const result = schema.safeParse({ type: "GET_STATUS" });

		expect(result.success).toBe(true);
	});

	it("приема STATUS_UPDATE и пази settings в payload-а", () => {
		const result = schema.safeParse({
			type: "STATUS_UPDATE",
			payload: { status: "running", errorMessage: null, settings: validSettings },
		});

		expect(result.success).toBe(true);
		if (!result.success || result.data.type !== "STATUS_UPDATE") {
			throw new Error("expected a successful STATUS_UPDATE parse");
		}
		expect(result.data.payload.settings).toEqual(validSettings);
	});

	it("отхвърля непознат type", () => {
		const result = schema.safeParse({ type: "UNKNOWN_TYPE" });

		expect(result.success).toBe(false);
	});
});

describe("getExtensionMessageResponseSchema", () => {
	const schema = getExtensionMessageResponseSchema(testSettingsSchema);

	it("приема ok:true отговор и пази settings от state-а", () => {
		const result = schema.safeParse({
			ok: true,
			state: { status: "running", errorMessage: null, settings: validSettings },
		});

		expect(result.success).toBe(true);
		if (!result.success || !result.data.ok) {
			throw new Error("expected a successful ok:true parse");
		}
		expect(result.data.state.settings).toEqual(validSettings);
	});

	it("приема ok:false отговор с error съобщение", () => {
		const result = schema.safeParse({ ok: false, error: "нещо се обърка" });

		expect(result.success).toBe(true);
	});

	it("отхвърля ok:true без state", () => {
		const result = schema.safeParse({ ok: true });

		expect(result.success).toBe(false);
	});

	it("отхвърля ok:false без error", () => {
		const result = schema.safeParse({ ok: false });

		expect(result.success).toBe(false);
	});
});
