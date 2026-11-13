import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	MISSIONS_HISTORY_STORAGE_KEY,
	MISSIONS_INITIAL_STATE,
	MISSIONS_STORAGE_KEY,
	readMissionsState,
} from "@/common/features/missions/missionsStateStorage";
import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import type { MissionsState } from "@/common/features/missions/models/missionsState";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";
import worldMissionWin from "./fixtures/world-mission-win.html?raw";
import worldNormal from "./fixtures/world-normal.html?raw";
import worldReturningMission from "./fixtures/world-returning-mission.html?raw";
import {
	type IMissionStepDeps,
	MAX_CONSECUTIVE_NAVIGATIONS,
	resetMissionStepForTests,
	runMissionStep,
} from "./runMissionStep";

const settings: MissionsSettings = {
	location: { id: "Volcano", name: "Вулкан" },
	city: "Талфор",
	karma: "dark",
	size: "large",
};

const running: MissionsState = {
	...MISSIONS_INITIAL_STATE,
	status: "running",
	settings,
};

const NOW = new Date(2026, 10, 11, 10, 20, 0).getTime();

describe("runMissionStep", () => {
	let storage: ReturnType<typeof installChromeStorageMock>;
	let deps: IMissionStepDeps & {
		navigate: ReturnType<typeof vi.fn<(url: string) => void>>;
		submit: ReturnType<typeof vi.fn<(form: HTMLFormElement) => void>>;
	};
	let clock: number;

	const setState = (state: Partial<MissionsState>) => {
		storage.store[MISSIONS_STORAGE_KEY] = { ...running, ...state };
	};

	const loadPage = (html: string) => {
		document.body.innerHTML = html;
	};

	beforeEach(() => {
		vi.useFakeTimers();
		storage = installChromeStorageMock();
		resetMissionStepForTests();
		clock = NOW;
		deps = {
			doc: document,
			now: () => clock,
			random: () => 0,
			navigate: vi.fn<(url: string) => void>(),
			submit: vi.fn<(form: HTMLFormElement) => void>(),
		};
		setState({});
	});

	afterEach(() => {
		resetMissionStepForTests();
		vi.useRealTimers();
	});

	it("не прави нищо, когато агентът не работи", async () => {
		setState({ status: "idle" });
		loadPage(worldNormal);

		await runMissionStep(deps);

		expect(deps.submit).not.toHaveBeenCalled();
		expect(deps.navigate).not.toHaveBeenCalled();
	});

	describe("пускане на мисия", () => {
		it("попълва формата на играта с избраната мисия и я изпраща", async () => {
			loadPage(worldNormal);

			await runMissionStep(deps);

			const form = document.getElementById(
				"formChooseMission",
			) as HTMLFormElement;
			const value = (name: string) =>
				(form.elements.namedItem(name) as HTMLInputElement).value;

			expect(deps.submit).toHaveBeenCalledWith(form);
			expect(value("chooseMission")).toBe("Volcano");
			expect(value("missionArt")).toBe("large");
			expect(value("missionKarma")).toBe("Evil");
		});

		it("никога не харчи рубини", async () => {
			loadPage(worldNormal);
			const buyRubies = document.getElementById(
				"buyRubies",
			) as HTMLInputElement;
			buyRubies.value = "1"; // каквото и да е оставила страницата

			await runMissionStep(deps);

			expect(buyRubies.value).toBe("0");
		});

		it("отбелязва мисията като чакаща репорт, преди да изпрати", async () => {
			loadPage(worldNormal);
			let wasPendingAtSubmit: boolean | undefined;
			deps.submit.mockImplementation(() => {
				wasPendingAtSubmit = (
					storage.store[MISSIONS_STORAGE_KEY] as MissionsState
				).isMissionPending;
			});

			await runMissionStep(deps);

			expect(wasPendingAtSubmit).toBe(true);
		});

		it("спира, ако формата на играта липсва", async () => {
			loadPage(worldNormal);
			document.getElementById("formChooseMission")?.remove();

			await runMissionStep(deps);

			expect(deps.submit).not.toHaveBeenCalled();
			expect(await readMissionsState()).toMatchObject({ status: "idle" });
		});
	});

	describe("репорт", () => {
		it("записва мисията в историята и в статистиката, после отива на картата", async () => {
			loadPage(worldMissionWin);
			setState({
				isMissionPending: true,
				run: { missions: 2, wins: 2, losses: 0, silver: 1000 },
			});

			await runMissionStep(deps);

			const state = await readMissionsState();
			expect(state.isMissionPending).toBe(false);
			expect(state.run).toEqual({
				missions: 3,
				wins: 3,
				losses: 0,
				silver: 2163,
			});
			expect(state.lastMission).toMatchObject({
				location: { id: "Volcano", name: "Вулкан" },
				city: "Талфор",
				size: "large",
				karma: "dark",
				won: true,
				silver: 1163,
				finishedAt: new Date(NOW).toISOString(),
			});
			expect(storage.store[MISSIONS_HISTORY_STORAGE_KEY]).toHaveLength(1);
			expect(deps.navigate).toHaveBeenCalledWith("http://localhost:3000/world");
		});

		it("не записва същия репорт два пъти", async () => {
			loadPage(worldMissionWin);
			setState({ isMissionPending: true });

			await runMissionStep(deps);
			await runMissionStep(deps);

			expect(storage.store[MISSIONS_HISTORY_STORAGE_KEY]).toHaveLength(1);
			expect((await readMissionsState()).run.missions).toBe(1);
		});
	});

	describe("чакане", () => {
		it("след таймера отива на картата, без да чете стария таймер наново", async () => {
			loadPage(worldReturningMission); // 00:01:51 + 15 s забавяне
			await runMissionStep(deps);

			expect((await readMissionsState()).wait).toEqual({
				until: NOW + 126_000,
				reason: "returning",
			});

			clock = NOW + 126_000;
			await vi.advanceTimersByTimeAsync(126_000);

			expect(deps.navigate).toHaveBeenCalledWith("http://localhost:3000/world");
			expect((await readMissionsState()).wait).toBeNull();
		});

		it("не навигира, ако агентът е спрян по време на чакането", async () => {
			loadPage(worldReturningMission);
			await runMissionStep(deps);

			setState({ status: "idle", wait: null });
			clock = NOW + 126_000;
			await vi.advanceTimersByTimeAsync(126_000);

			expect(deps.navigate).not.toHaveBeenCalled();
		});

		it("повторна стъпка по време на чакането пази само един таймер", async () => {
			loadPage(worldReturningMission);
			await runMissionStep(deps);
			await runMissionStep(deps); // напр. табът е върнат на преден план

			// Два таймера биха прочели състоянието едновременно в истинския
			// (асинхронен) storage и биха навигирали и двата.
			expect(vi.getTimerCount()).toBe(1);

			clock = NOW + 126_000;
			await vi.advanceTimersByTimeAsync(126_000);

			expect(deps.navigate).toHaveBeenCalledTimes(1);
		});
	});

	describe("circuit breaker", () => {
		it("спира след твърде много поредни навигации без мисия", async () => {
			loadPage("<div id='mainContent' class='tavern'></div>");
			setState({ consecutiveNavigations: MAX_CONSECUTIVE_NAVIGATIONS - 1 });

			await runMissionStep(deps);

			expect(deps.navigate).not.toHaveBeenCalled();
			expect(await readMissionsState()).toMatchObject({
				status: "error",
				consecutiveNavigations: 0,
			});
		});

		it("брои всяка навигация към картата", async () => {
			loadPage("<div id='mainContent' class='tavern'></div>");
			setState({ consecutiveNavigations: 3 });

			await runMissionStep(deps);

			expect((await readMissionsState()).consecutiveNavigations).toBe(4);
		});

		it("умишленото чакане нулира брояча", async () => {
			loadPage(worldReturningMission);
			setState({ consecutiveNavigations: 5 });

			await runMissionStep(deps);

			expect((await readMissionsState()).consecutiveNavigations).toBe(0);
		});
	});

	it("спирането за деня оставя причината за popup-а", async () => {
		loadPage(worldNormal);
		for (const button of document.querySelectorAll(".specialButton")) {
			button.classList.add("disabledSpecialBtn");
		}
		for (const span of document.querySelectorAll(".missionPoints span")) {
			span.textContent = "10";
		}

		await runMissionStep(deps);

		expect(await readMissionsState()).toMatchObject({
			status: "idle",
			errorMessage: expect.stringContaining("No mission points left"),
		});
	});
});
