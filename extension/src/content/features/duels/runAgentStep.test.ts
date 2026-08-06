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

	it("не прави нищо ако агентът не работи", async () => {
		mockStore.isRunning.mockResolvedValue(false);

		await runAgentStep();

		expect(mockEngine.runStep).not.toHaveBeenCalled();
		expect(mockStore.reportProgress).not.toHaveBeenCalled();
	});
});
