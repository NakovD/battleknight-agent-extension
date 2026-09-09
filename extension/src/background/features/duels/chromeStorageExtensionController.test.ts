import { beforeEach, describe, expect, it, vi } from "vitest";
import { DUELS_STORAGE_KEY } from "@/common/features/duels/constants/duelsStateConstants";
import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";
import { ChromeStorageAgentController } from "./chromeStorageExtensionController";

const settings: DuelsSettings = {
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

describe("ChromeStorageAgentController", () => {
	let controller: ChromeStorageAgentController;
	let chromeStorage: ReturnType<typeof installChromeStorageMock>;

	beforeEach(() => {
		chromeStorage = installChromeStorageMock();
		controller = new ChromeStorageAgentController();
	});

	it("getStatus връща началното състояние ако storage е празен", async () => {
		const state = await controller.getStatus();

		expect(state.status).toBe("idle");
		expect(state.settings).toBeNull();
	});

	it("start маркира агента като running, записва настройките и нулира брояча на навигации", async () => {
		chromeStorage.store[DUELS_STORAGE_KEY] = {
			status: "idle",
			errorMessage: null,
			settings: null,
			attacksToday: 3,
			lastAttackAt: null,
			waitUntil: null,
			currentEnemyName: null,
			consecutiveNavigations: 6,
		} satisfies DuelsExtensionState;

		await controller.start(settings);

		const state = await controller.getStatus();
		expect(state.status).toBe("running");
		expect(state.settings).toEqual(settings);
		expect(state.consecutiveNavigations).toBe(0);
		// attacksToday от преди старта се пази
		expect(state.attacksToday).toBe(3);
	});

	it("stop маркира агента като idle, без да губи settings", async () => {
		await controller.start(settings);

		await controller.stop();

		const state = await controller.getStatus();
		expect(state.status).toBe("idle");
		expect(state.settings).toEqual(settings);
	});

	it("updateStatus обединява подадения patch с текущото състояние", async () => {
		await controller.start(settings);

		const next = await controller.updateStatus({ attacksToday: 7 });

		expect(next.attacksToday).toBe(7);
		expect(next.status).toBe("running");
		expect((await controller.getStatus()).attacksToday).toBe(7);
	});

	it("onStatusChange известява handler-ите при start/stop/updateStatus", async () => {
		const handler = vi.fn();
		controller.onStatusChange(handler);

		await controller.start(settings);

		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({ status: "running" }),
		);
	});

	it("връщаната от onStatusChange функция спира по-нататъшни известявания", async () => {
		const handler = vi.fn();
		const unsubscribe = controller.onStatusChange(handler);

		unsubscribe();
		await controller.start(settings);

		expect(handler).not.toHaveBeenCalled();
	});

	it("извиква onStatusChange handler-ите при промяна на storage отвън (напр. content script)", () => {
		const handler = vi.fn();
		controller.onStatusChange(handler);

		const externalState: DuelsExtensionState = {
			status: "running",
			errorMessage: null,
			settings,
			attacksToday: 1,
			lastAttackAt: null,
			waitUntil: null,
			currentEnemyName: "Enemy Knight",
			consecutiveNavigations: 1,
		};

		chromeStorage.dispatchChange(DUELS_STORAGE_KEY, externalState);

		expect(handler).toHaveBeenCalledWith(externalState);
	});

	it("игнорира промени в друг storage area", () => {
		const handler = vi.fn();
		controller.onStatusChange(handler);

		chromeStorage.dispatchChange(DUELS_STORAGE_KEY, { status: "running" }, "sync");

		expect(handler).not.toHaveBeenCalled();
	});

	it("игнорира промени по друг ключ", () => {
		const handler = vi.fn();
		controller.onStatusChange(handler);

		chromeStorage.dispatchChange("someOtherKey", { status: "running" });

		expect(handler).not.toHaveBeenCalled();
	});
});
