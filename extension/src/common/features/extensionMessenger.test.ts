import { beforeEach, describe, expect, it, vi } from "vitest";
import { boolean, number, object } from "zod";
import { installChromeRuntimeMock } from "@/testUtils/chromeRuntimeMock";
import { extensionMessenger } from "./extensionMessenger";

const testSettingsSchema = object({ levelMin: number(), enabled: boolean() });
const validSettings = { levelMin: 5, enabled: true };

describe("extensionMessenger.send", () => {
	let chromeRuntime: ReturnType<typeof installChromeRuntimeMock>;

	beforeEach(() => {
		chromeRuntime = installChromeRuntimeMock();
	});

	it("разрешава промиса с валиден отговор", async () => {
		chromeRuntime.setNextResponse({
			ok: true,
			state: { status: "idle", errorMessage: null, settings: null },
		});

		const result = await extensionMessenger.send(
			{ type: "GET_STATUS" },
			testSettingsSchema,
		);

		expect(result).toEqual({
			ok: true,
			state: { status: "idle", errorMessage: null, settings: null },
		});
	});

	it("пази settings в успешния отговор", async () => {
		chromeRuntime.setNextResponse({
			ok: true,
			state: { status: "running", errorMessage: null, settings: validSettings },
		});

		const result = await extensionMessenger.send(
			{ type: "GET_STATUS" },
			testSettingsSchema,
		);

		expect(result.ok && result.state.settings).toEqual(validSettings);
	});

	it("праща точно съобщението, подадено на send", async () => {
		chromeRuntime.setNextResponse({
			ok: true,
			state: { status: "idle", errorMessage: null, settings: null },
		});

		await extensionMessenger.send(
			{ type: "START_AGENT", payload: validSettings },
			testSettingsSchema,
		);

		expect(chromeRuntime.sendMessage).toHaveBeenCalledWith(
			{ type: "START_AGENT", payload: validSettings },
			expect.any(Function),
		);
	});

	it("отхвърля промиса при chrome.runtime.lastError", async () => {
		chromeRuntime.setLastError("Could not establish connection.");
		chromeRuntime.setNextResponse(undefined);

		await expect(
			extensionMessenger.send({ type: "GET_STATUS" }, testSettingsSchema),
		).rejects.toBe("Could not establish connection.");
	});

	it("отхвърля промиса при невалиден по схема отговор", async () => {
		chromeRuntime.setNextResponse({ ok: true, state: { status: "unknown" } });

		await expect(
			extensionMessenger.send({ type: "GET_STATUS" }, testSettingsSchema),
		).rejects.toMatch(/Invalid response/);
	});
});

describe("extensionMessenger.listen", () => {
	let chromeRuntime: ReturnType<typeof installChromeRuntimeMock>;

	beforeEach(() => {
		chromeRuntime = installChromeRuntimeMock();
	});

	it("вика handler-а при валидно съобщение по схемата", () => {
		const handler = vi.fn();
		extensionMessenger.listen(handler, testSettingsSchema);

		chromeRuntime.dispatchMessage({
			type: "STATUS_UPDATE",
			payload: { status: "running", errorMessage: null, settings: validSettings },
		});

		expect(handler).toHaveBeenCalledWith({
			type: "STATUS_UPDATE",
			payload: { status: "running", errorMessage: null, settings: validSettings },
		});
	});

	it("не вика handler-а при съобщение, което не пасва на схемата", () => {
		const handler = vi.fn();
		extensionMessenger.listen(handler, testSettingsSchema);

		chromeRuntime.dispatchMessage({ type: "NOT_A_REAL_TYPE" });

		expect(handler).not.toHaveBeenCalled();
	});

	it("unsubscribe спира по-нататъшни известявания", () => {
		const handler = vi.fn();
		const unsubscribe = extensionMessenger.listen(handler, testSettingsSchema);

		unsubscribe();
		chromeRuntime.dispatchMessage({ type: "GET_STATUS" });

		expect(handler).not.toHaveBeenCalled();
		expect(chromeRuntime.listenerCount()).toBe(0);
	});
});
