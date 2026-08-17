import { beforeEach, describe, expect, it } from "vitest";
import { DUELS_STORAGE_KEY } from "@/common/features/duels/constants/duelsStateConstants";
import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";
import { ChromeStorageDuelsStateStore } from "./chromeStorageDuelsStateStore";

const runningState: DuelsExtensionState = {
	status: "running",
	errorMessage: null,
	settings: {
		levelMin: 5,
		levelMax: 30,
		lootFilterEnabled: true,
		lootMax: 3_000_000,
		skipAllOrders: false,
		skipSpecificOrders: false,
		ordersToSkip: [],
		cooldownMs: 120_000,
		rankingOffset: 0,
	},
	attacksToday: 4,
	lastAttackAt: "2026-08-05T10:40:15.516Z",
	waitUntil: null,
	currentEnemyName: null,
	consecutiveNavigations: 0,
};

describe("ChromeStorageDuelsStateStore", () => {
	let store: ChromeStorageDuelsStateStore;
	let chromeStorage: ReturnType<typeof installChromeStorageMock>;

	beforeEach(() => {
		chromeStorage = installChromeStorageMock();
		store = new ChromeStorageDuelsStateStore();
	});

	it("връща началното състояние ако storage е празен", async () => {
		const state = await store.getState();

		expect(state.status).toBe("idle");
		expect(state.settings).toBeNull();
	});

	it("връща записаното състояние", async () => {
		chromeStorage.store[DUELS_STORAGE_KEY] = runningState;

		const state = await store.getState();

		expect(state).toEqual(runningState);
	});

	it("isRunning връща true само при status running", async () => {
		chromeStorage.store[DUELS_STORAGE_KEY] = runningState;
		expect(await store.isRunning()).toBe(true);

		chromeStorage.store[DUELS_STORAGE_KEY] = { ...runningState, status: "idle" };
		expect(await store.isRunning()).toBe(false);
	});

	it("getSettings връща settings от текущото състояние", async () => {
		chromeStorage.store[DUELS_STORAGE_KEY] = runningState;

		expect(await store.getSettings()).toEqual(runningState.settings);
	});

	it("getSettings връща null ако няма зададени настройки", async () => {
		expect(await store.getSettings()).toBeNull();
	});

	it("reportProgress записва partial промяна върху текущото състояние", async () => {
		chromeStorage.store[DUELS_STORAGE_KEY] = runningState;

		await store.reportProgress({ attacksToday: 5, currentEnemyName: "Enemy" });

		const stored = chromeStorage.store[DUELS_STORAGE_KEY] as DuelsExtensionState;
		expect(stored.attacksToday).toBe(5);
		expect(stored.currentEnemyName).toBe("Enemy");
		// Останалите полета остават непроменени
		expect(stored.settings).toEqual(runningState.settings);
		expect(stored.status).toBe("running");
	});

	it("reportProgress върху празен storage тръгва от началното състояние", async () => {
		await store.reportProgress({ attacksToday: 1 });

		const stored = chromeStorage.store[DUELS_STORAGE_KEY] as DuelsExtensionState;
		expect(stored.attacksToday).toBe(1);
		expect(stored.status).toBe("idle");
	});
});
