import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	MISSIONS_INITIAL_STATE,
	missionsAgentKey,
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

	it("start пуска нов цикъл в своя таб и пази последната мисия", async () => {
		storage.sessionStore[missionsAgentKey(7)] = {
			...MISSIONS_INITIAL_STATE,
			status: "error",
			errorMessage: "стара грешка",
			wait: { until: 1, reason: "hit-points" },
			lastMission,
			run: { missions: 7, wins: 6, losses: 1, silver: 5000 },
			consecutiveNavigations: 5,
		};

		await controller.start(7, settings);

		expect(await readMissionsState(7)).toEqual({
			...MISSIONS_INITIAL_STATE,
			status: "running",
			settings,
			lastMission,
		});
	});

	it("start в един таб не пипа агента на друг", async () => {
		await controller.start(7, settings);

		expect(await readMissionsState(9)).toEqual(MISSIONS_INITIAL_STATE);
	});

	it("stop спира само агента на своя таб", async () => {
		await controller.start(7, settings);
		await controller.start(9, settings);

		await controller.stop(7);

		expect((await readMissionsState(7)).status).toBe("idle");
		expect((await readMissionsState(9)).status).toBe("running");
	});

	it("stop изчиства чакането", async () => {
		await controller.start(7, settings);
		storage.sessionStore[missionsAgentKey(7)] = {
			...(storage.sessionStore[missionsAgentKey(7)] as object),
			wait: { until: 1, reason: "returning" },
			isMissionPending: true,
		};

		await controller.stop(7);

		expect(await readMissionsState(7)).toMatchObject({
			wait: null,
			isMissionPending: false,
			settings,
		});
	});

	describe("endHitPointsWait", () => {
		it("прекратява чакането за живот и брои презареждането", async () => {
			await controller.start(7, settings);
			storage.sessionStore[missionsAgentKey(7)] = {
				...(storage.sessionStore[missionsAgentKey(7)] as object),
				wait: { until: Date.now() + 600_000, reason: "hit-points" },
				consecutiveNavigations: 2,
			};

			expect(await controller.endHitPointsWait(7)).toBe(true);
			expect(await readMissionsState(7)).toMatchObject({
				status: "running",
				wait: null,
				consecutiveNavigations: 3,
			});
		});

		it.each([
			["връщане от мисия", "running", { until: 1, reason: "returning" }],
			["няма чакане", "running", null],
			["спрян агент", "idle", { until: 1, reason: "hit-points" }],
		])("не пипа нищо при %s", async (_case, status, wait) => {
			storage.sessionStore[missionsAgentKey(7)] = {
				...MISSIONS_INITIAL_STATE,
				status,
				settings,
				wait,
			};
			const before = await readMissionsState(7);

			expect(await controller.endHitPointsWait(7)).toBe(false);
			expect(await readMissionsState(7)).toEqual(before);
		});
	});

	it("isAnyRunning вижда агент в който и да е таб", async () => {
		expect(await controller.isAnyRunning()).toBe(false);

		await controller.start(9, settings);

		expect(await controller.isAnyRunning()).toBe(true);
	});

	it("remove премахва агента на затворен таб", async () => {
		await controller.start(7, settings);

		await controller.remove(7);

		expect(storage.sessionStore).not.toHaveProperty(missionsAgentKey(7));
		expect(await controller.isAnyRunning()).toBe(false);
	});

	it("уведомява с таба при всяка промяна, включително от content script-а", () => {
		const listener = vi.fn();
		controller.onStatusChange(listener);

		storage.dispatchChange(
			missionsAgentKey(7),
			{ ...MISSIONS_INITIAL_STATE, status: "running" },
			"session",
		);

		expect(listener).toHaveBeenCalledWith(
			7,
			expect.objectContaining({ status: "running" }),
		);
	});

	it("не уведомява за премахнат агент, чужди ключове или local storage", () => {
		const listener = vi.fn();
		controller.onStatusChange(listener);

		storage.dispatchChange(missionsAgentKey(7), undefined, "session");
		storage.dispatchChange(
			"duelsExtensionState",
			{ status: "running" },
			"session",
		);
		storage.dispatchChange(missionsAgentKey(7), { status: "running" }, "local");

		expect(listener).not.toHaveBeenCalled();
	});
});
