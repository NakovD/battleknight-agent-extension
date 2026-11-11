import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	MISSIONS_INITIAL_STATE,
	MISSIONS_STORAGE_KEY,
	readMissionsState,
} from "@/common/features/missions/missionsStateStorage";
import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";
import { ChromeStorageMissionsController } from "./chromeStorageMissionsController";

const settings: MissionsSettings = {
	location: { id: "Volcano", name: "Вулкан" },
	city: "Талфор",
	karma: "dark",
	size: "medium",
};

const lastMission = {
	finishedAt: "2026-11-11T10:00:00.000Z",
	city: "Талфор",
	location: { id: "Volcano", name: "Вулкан" },
	karma: "dark" as const,
	size: "small" as const,
	won: true,
	opponent: { id: null, name: null },
	silver: 1163,
	payout: null,
	experience: null,
	karmaGained: null,
	damageTaken: null,
};

describe("ChromeStorageMissionsController", () => {
	let storage: ReturnType<typeof installChromeStorageMock>;
	let controller: ChromeStorageMissionsController;

	beforeEach(() => {
		storage = installChromeStorageMock();
		controller = new ChromeStorageMissionsController();
	});

	it("start пуска нов цикъл и пази последната мисия", async () => {
		storage.store[MISSIONS_STORAGE_KEY] = {
			...MISSIONS_INITIAL_STATE,
			status: "error",
			errorMessage: "стара грешка",
			wait: { until: 1, reason: "hit-points" },
			lastMission,
			run: { missions: 7, wins: 6, losses: 1, silver: 5000 },
			consecutiveNavigations: 5,
		};

		await controller.start(settings);

		expect(await readMissionsState()).toEqual({
			...MISSIONS_INITIAL_STATE,
			status: "running",
			settings,
			lastMission,
		});
	});

	it("stop спира агента и изчиства чакането", async () => {
		await controller.start(settings);
		storage.store[MISSIONS_STORAGE_KEY] = {
			...(storage.store[MISSIONS_STORAGE_KEY] as object),
			wait: { until: 1, reason: "returning" },
			isMissionPending: true,
		};

		await controller.stop();

		expect(await readMissionsState()).toMatchObject({
			status: "idle",
			wait: null,
			isMissionPending: false,
			settings,
		});
	});

	it("уведомява за всяка промяна в storage, включително от content script-а", () => {
		const listener = vi.fn();
		controller.onStatusChange(listener);

		storage.dispatchChange(MISSIONS_STORAGE_KEY, {
			...MISSIONS_INITIAL_STATE,
			status: "running",
		});

		expect(listener).toHaveBeenCalledWith(
			expect.objectContaining({ status: "running" }),
		);
	});

	it("не реагира на чужди ключове", () => {
		const listener = vi.fn();
		controller.onStatusChange(listener);

		storage.dispatchChange("duelsExtensionState", { status: "running" });

		expect(listener).not.toHaveBeenCalled();
	});
});
