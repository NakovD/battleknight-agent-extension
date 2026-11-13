import { beforeEach, describe, expect, it } from "vitest";
import { MISSIONS_INITIAL_STATE } from "@/common/features/missions/missionsStateStorage";
import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import type { MissionsState } from "@/common/features/missions/models/missionsState";
import {
	decideMissionStep,
	HIT_POINTS_RECHECK_MS,
	RANDOM_DELAY_MAX_MS,
	RANDOM_DELAY_MIN_MS,
	RETRY_MS,
} from "./decideMissionStep";
import worldMissionWin from "./fixtures/world-mission-win.html?raw";
import worldNoHealth from "./fixtures/world-no-health.html?raw";
import worldNormal from "./fixtures/world-normal.html?raw";
import worldReturningMission from "./fixtures/world-returning-mission.html?raw";

const settings: MissionsSettings = {
	location: { id: "Volcano", name: "Вулкан" },
	city: "Талфор",
	karma: "dark",
	size: "medium",
};

const running: MissionsState = {
	...MISSIONS_INITIAL_STATE,
	status: "running",
	settings,
};

// 10:20 местно време — до кръглия час остават 40 минути.
const now = new Date(2026, 10, 11, 10, 20, 0).getTime();

const decide = (state: MissionsState = running, random = () => 0) =>
	decideMissionStep(document, state, settings, { now, random });

const loadPage = (html: string) => {
	document.body.innerHTML = html;
};

const setFreePoints = (points: string) => {
	for (const span of document.querySelectorAll(
		"#squeezeBoxContent .missionPoints span",
	)) {
		span.textContent = points;
	}
};

describe("decideMissionStep", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	describe("на картата", () => {
		it("пуска мисия, когато бутонът е активен", () => {
			loadPage(worldNormal);

			expect(decide()).toEqual({ action: "start-mission" });
		});

		it("без точки живот чака кръглия час, ако е по-рано от 15 минути", () => {
			loadPage(worldNoHealth);
			// 10:50 — кръглият час (11:00 + 1 мин) идва преди 15-те минути.
			const nearHour = new Date(2026, 10, 11, 10, 50, 0).getTime();

			expect(
				decideMissionStep(document, running, settings, {
					now: nearHour,
					random: () => 0,
				}),
			).toEqual({
				action: "wait",
				wait: {
					until: new Date(2026, 10, 11, 11, 1, 0).getTime(),
					reason: "hit-points",
				},
			});
		});

		it("без точки живот проверява след 15 минути, ако часът е далеч", () => {
			loadPage(worldNoHealth); // в 10:20 до кръглия час има 40 минути

			expect(decide()).toEqual({
				action: "wait",
				wait: { until: now + HIT_POINTS_RECHECK_MS, reason: "hit-points" },
			});
		});

		it("без точки за избрания размер спира за деня", () => {
			loadPage(worldNoHealth);
			setFreePoints("39"); // средна струва 40

			const step = decide();

			expect(step.action).toBe("stop");
			expect(step).toHaveProperty(
				"reason",
				expect.stringContaining("No mission points left"),
			);
		});

		it("точно колкото струва мисията все още е живот, не точки", () => {
			loadPage(worldNoHealth);
			setFreePoints("40");

			expect(decide()).toMatchObject({
				action: "wait",
				wait: { reason: "hit-points" },
			});
		});

		it("спира, когато локацията не е в този град", () => {
			loadPage(worldNormal);

			const step = decideMissionStep(
				document,
				running,
				{
					...settings,
					location: { id: "Bridge", name: "Мост" },
					city: "Алкран",
				},
				{ now, random: () => 0 },
			);

			expect(step.action).toBe("stop");
			expect(step).toHaveProperty("reason", expect.stringContaining("Алкран"));
		});

		it("не бърка id на друг елемент от страницата с локация", () => {
			loadPage(worldNormal);

			const step = decideMissionStep(
				document,
				running,
				{ ...settings, location: { id: "mapBase", name: "Карта" } },
				{ now, random: () => 0 },
			);

			expect(step.action).toBe("stop");
		});
	});

	describe("на таймера", () => {
		it("чака оставащото време плюс поне минималното забавяне", () => {
			loadPage(worldReturningMission); // 00:01:51

			expect(decide(running, () => 0)).toEqual({
				action: "wait",
				wait: {
					until: now + 111_000 + RANDOM_DELAY_MIN_MS,
					reason: "returning",
				},
			});
		});

		it("забавянето никога не надхвърля максимума", () => {
			loadPage(worldReturningMission);

			expect(decide(running, () => 0.999_999)).toEqual({
				action: "wait",
				wait: {
					until: now + 111_000 + RANDOM_DELAY_MAX_MS,
					reason: "returning",
				},
			});
		});

		it("таймер, който не се чете, се проверява пак след минута", () => {
			loadPage(worldReturningMission);
			const timer = document.querySelector("#progressbarEnds span");
			if (timer) timer.textContent = "";

			expect(decide()).toEqual({
				action: "wait",
				wait: { until: now + RETRY_MS, reason: "retry" },
			});
		});

		it("докато чакането тече, не започва ново", () => {
			loadPage(worldReturningMission);
			const wait = { until: now + 5_000, reason: "returning" as const };

			expect(decide({ ...running, wait })).toEqual({ action: "wait", wait });
		});

		it("след като чакането е минало, чете таймера наново", () => {
			loadPage(worldNormal);
			const wait = { until: now - 1, reason: "returning" as const };

			expect(decide({ ...running, wait })).toEqual({ action: "start-mission" });
		});
	});

	describe("на репорта", () => {
		it("записва мисията, която агентът е пуснал", () => {
			loadPage(worldMissionWin);

			expect(decide({ ...running, isMissionPending: true })).toMatchObject({
				action: "record",
				report: { won: true, silver: 1163 },
			});
		});

		it("записва дори ако има неизтекло чакане", () => {
			loadPage(worldMissionWin);

			expect(
				decide({
					...running,
					isMissionPending: true,
					wait: { until: now + 60_000, reason: "returning" },
				}),
			).toMatchObject({ action: "record" });
		});

		it("чужд или вече записан репорт само води към картата", () => {
			loadPage(worldMissionWin);

			expect(decide()).toEqual({ action: "go-to-world" });
		});
	});

	it("от всяка друга страница отива към картата", () => {
		loadPage("<div id='mainContent' class='tavern'></div>");

		expect(decide()).toEqual({ action: "go-to-world" });
	});
});
