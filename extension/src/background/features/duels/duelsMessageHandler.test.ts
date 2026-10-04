import { describe, expect, it, vi } from "vitest";
import { DUELS_INITIAL_EXTENSION_STATE } from "@/common/features/duels/constants/duelsStateConstants";
import { createDuelsMessageHandler } from "./duelsMessageHandler";
import type { IDuelsExtensionController } from "./models/duelsExtensionController.ts ";

const settings = {
	levelMin: 0,
	levelMax: 30,
	lootFilterEnabled: true,
	lootMax: 3_000_000,
	skipAllOrders: false,
	skipSpecificOrders: false,
	ordersToSkip: [],
	cooldownMs: 120_000,
	rankingOffset: 0,
};

const createController = () =>
	({
		start: vi.fn(async () => {}),
		stop: vi.fn(async () => {}),
		getStatus: vi.fn(async () => DUELS_INITIAL_EXTENSION_STATE),
		updateStatus: vi.fn(),
		onStatusChange: vi.fn(),
	}) satisfies IDuelsExtensionController;

describe("createDuelsMessageHandler", () => {
	it("връща null за съобщения, които не са duels", () => {
		const handle = createDuelsMessageHandler(createController());

		expect(handle({ type: "AUTH_LOGIN" })).toBeNull();
		expect(handle({ type: "START_AGENT", payload: { levelMin: -1 } })).toBeNull();
	});

	it("START_AGENT стартира агента и връща състоянието", async () => {
		const controller = createController();

		const reply = await createDuelsMessageHandler(controller)({
			type: "START_AGENT",
			payload: settings,
		});

		expect(controller.start).toHaveBeenCalledWith(settings);
		expect(reply).toEqual({ ok: true, state: DUELS_INITIAL_EXTENSION_STATE });
	});

	it("връща грешката, ако контролерът се провали", async () => {
		const controller = createController();
		controller.stop.mockRejectedValue(new Error("storage unavailable"));

		const reply = await createDuelsMessageHandler(controller)({ type: "STOP_AGENT" });

		expect(reply).toEqual({ ok: false, error: "storage unavailable" });
	});
});
