import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";

const mockStore = {
	isRunning: vi.fn(),
	getState: vi.fn(),
	getSettings: vi.fn(),
	reportProgress: vi.fn(),
};

const mockEngine = {
	runStep: vi.fn(),
};

vi.mock("@/content/features/duels/chromeStorageDuelsStateStore", () => ({
	ChromeStorageDuelsStateStore: vi.fn(function ChromeStorageDuelsStateStoreMock() {
		return mockStore;
	}),
}));

vi.mock("@/content/features/duels/factory/duelsEngineFactory", () => ({
	createDuelsEngine: vi.fn(() => mockEngine),
}));

const { runAgentStep } = await import("./runAgentStep");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const settings: DuelsSettings = {
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

function buildState(
	overrides: Partial<DuelsExtensionState> = {},
): DuelsExtensionState {
	return {
		status: "running",
		errorMessage: null,
		settings,
		attacksToday: 0,
		lastAttackAt: null,
		waitUntil: null,
		currentEnemyName: null,
		currentEnemyId: null,
		refusedEnemyIds: [],
		consecutiveNavigations: 0,
		...overrides,
	};
}

// ─── Тестове ──────────────────────────────────────────────────────────────────

describe("runAgentStep — circuit breaker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockStore.isRunning.mockResolvedValue(true);
	});

	it("увеличава consecutiveNavigations при navigated резултат", async () => {
		mockStore.getState.mockResolvedValue(buildState({ consecutiveNavigations: 2 }));
		mockEngine.runStep.mockResolvedValue({ action: "navigated" });

		await runAgentStep();

		expect(mockStore.reportProgress).toHaveBeenCalledWith(
			expect.objectContaining({ consecutiveNavigations: 3 }),
		);
	});

	it("спира агента с грешка след MAX_CONSECUTIVE_NAVIGATIONS последователни навигации", async () => {
		mockStore.getState.mockResolvedValue(buildState({ consecutiveNavigations: 7 }));
		mockEngine.runStep.mockResolvedValue({ action: "navigated" });

		await runAgentStep();

		expect(mockStore.reportProgress).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "error",
				consecutiveNavigations: 0,
			}),
		);
	});

	it("нулира consecutiveNavigations при успешна атака", async () => {
		mockStore.getState.mockResolvedValue(buildState({ consecutiveNavigations: 5 }));
		mockEngine.runStep.mockResolvedValue({
			action: "attacked",
			won: true,
			waitMs: 120_000,
		});

		await runAgentStep();

		expect(mockStore.reportProgress).toHaveBeenCalledWith(
			expect.objectContaining({ consecutiveNavigations: 0 }),
		);
	});

	it("нулира consecutiveNavigations при done (няма валидна цел)", async () => {
		mockStore.getState.mockResolvedValue(buildState({ consecutiveNavigations: 5 }));
		mockEngine.runStep.mockResolvedValue({ action: "done" });

		await runAgentStep();

		expect(mockStore.reportProgress).toHaveBeenCalledWith(
			expect.objectContaining({ status: "idle", consecutiveNavigations: 0 }),
		);
	});

	it("записва причината за спиране, за да се види в popup-а", async () => {
		mockStore.getState.mockResolvedValue(buildState());
		mockEngine.runStep.mockResolvedValue({
			action: "done",
			reason: "None of the 100 knights on this ranking page matched your filters.",
		});

		await runAgentStep();

		expect(mockStore.reportProgress).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "idle",
				errorMessage:
					"None of the 100 knights on this ranking page matched your filters.",
			}),
		);
	});

	it("изчиства старото съобщение, когато спирането е без причина", async () => {
		mockStore.getState.mockResolvedValue(buildState());
		mockEngine.runStep.mockResolvedValue({ action: "done" });

		await runAgentStep();

		expect(mockStore.reportProgress).toHaveBeenCalledWith(
			expect.objectContaining({ status: "idle", errorMessage: null }),
		);
	});

	it("запомня кого атакува, за да се знае кой е отказан после", async () => {
		mockStore.getState.mockResolvedValue(buildState());
		mockEngine.runStep.mockResolvedValue({
			action: "navigated",
			knightId: "3793",
			enemyName: "Поданик dsgfersfd",
		});

		await runAgentStep();

		expect(mockStore.reportProgress).toHaveBeenCalledWith(
			expect.objectContaining({
				currentEnemyId: "3793",
				currentEnemyName: "Поданик dsgfersfd",
			}),
		);
	});

	it("при отказан дуел не пробва повече същия рицар", async () => {
		mockStore.getState.mockResolvedValue(
			buildState({ currentEnemyId: "3793", currentEnemyName: "Some Knight" }),
		);
		mockEngine.runStep.mockResolvedValue({
			action: "refused",
			reason: "The game refused the duel with Some Knight.",
		});

		await runAgentStep();

		const patch = mockStore.reportProgress.mock.calls[0][0];
		expect(patch.refusedEnemyIds).toEqual(["3793"]);
		expect(patch.currentEnemyId).toBeNull();
		expect(patch.errorMessage).toBe("The game refused the duel with Some Knight.");
	});

	it("отказът не добавя изчакване, за да се мине веднага на следващия рицар", async () => {
		mockStore.getState.mockResolvedValue(buildState({ currentEnemyId: "3793" }));
		mockEngine.runStep.mockResolvedValue({ action: "refused" });

		await runAgentStep();

		// Липсващо поле означава "остави каквото е", а не "изчакай наново".
		expect(mockStore.reportProgress.mock.calls[0][0]).not.toHaveProperty(
			"waitUntil",
		);
	});

	it("отказът не изтрива cooldown-а от последната атака", async () => {
		const cooldownUntil = Date.now() + 90_000;
		mockStore.getState.mockResolvedValue(
			buildState({ currentEnemyId: "3793", waitUntil: cooldownUntil }),
		);
		mockEngine.runStep.mockResolvedValue({ action: "refused" });

		await runAgentStep();

		const patch = mockStore.reportProgress.mock.calls[0][0];
		expect(patch.waitUntil).toBeUndefined();
	});

	it("не нулира брояча на навигации при отказ, за да може circuit breaker-ът да сработи", async () => {
		mockStore.getState.mockResolvedValue(
			buildState({ currentEnemyId: "3793", consecutiveNavigations: 5 }),
		);
		mockEngine.runStep.mockResolvedValue({ action: "refused", waitMs: 1000 });

		await runAgentStep();

		expect(mockStore.reportProgress.mock.calls[0][0]).not.toHaveProperty(
			"consecutiveNavigations",
		);
	});

	it("пази списъка с отказани рицари без повторения и ограничен по размер", async () => {
		const existing = Array.from({ length: 20 }, (_, i) => `id-${i}`);
		mockStore.getState.mockResolvedValue(
			buildState({ currentEnemyId: "id-3", refusedEnemyIds: existing }),
		);
		mockEngine.runStep.mockResolvedValue({ action: "refused", waitMs: 1000 });

		await runAgentStep();

		const { refusedEnemyIds } = mockStore.reportProgress.mock.calls[0][0];
		expect(refusedEnemyIds).toHaveLength(20);
		expect(refusedEnemyIds.filter((id: string) => id === "id-3")).toHaveLength(1);
		expect(refusedEnemyIds.at(-1)).toBe("id-3");
	});

	it("подава отказаните рицари на engine-а", async () => {
		mockStore.getState.mockResolvedValue(buildState({ refusedEnemyIds: ["7"] }));
		mockEngine.runStep.mockResolvedValue({ action: "done" });

		await runAgentStep();

		expect(mockEngine.runStep).toHaveBeenCalledWith(
			settings,
			expect.objectContaining({ refusedEnemyIds: ["7"] }),
		);
	});

	it("не прави нищо ако агентът не работи", async () => {
		mockStore.isRunning.mockResolvedValue(false);

		await runAgentStep();

		expect(mockEngine.runStep).not.toHaveBeenCalled();
		expect(mockStore.reportProgress).not.toHaveBeenCalled();
	});
});
