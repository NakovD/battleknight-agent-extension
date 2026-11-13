import { beforeEach, describe, expect, it } from "vitest";
import worldMissionWin from "./fixtures/world-mission-win.html?raw";
import worldNormal from "./fixtures/world-normal.html?raw";
import worldReturningDuel from "./fixtures/world-returning-duel.html?raw";
import worldReturningMission from "./fixtures/world-returning-mission.html?raw";
import worldTravelling from "./fixtures/world-travelling.html?raw";
import {
	detectMissionPage,
	readCountdownMs,
	readMissionReport,
} from "./readMissionPages";

const loadPage = (html: string) => {
	document.body.innerHTML = html;
};

describe("detectMissionPage", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it.each([
		[worldNormal, "map"],
		[worldMissionWin, "report"],
		[worldReturningMission, "countdown"],
		[worldTravelling, "countdown"],
		[worldReturningDuel, "countdown"],
		["<p>таверна</p>", "other"],
	])("разпознава страницата (%#)", (html, page) => {
		loadPage(html);

		expect(detectMissionPage(document)).toBe(page);
	});

	it("резултат от дуел не е репорт от мисия", () => {
		loadPage(worldMissionWin);
		document.querySelector("#missionText")?.remove();

		expect(detectMissionPage(document)).toBe("other");
	});
});

describe("readCountdownMs", () => {
	it("чете оставащото време от таймера", () => {
		loadPage(worldReturningMission); // 00:01:51

		expect(readCountdownMs(document)).toBe(111_000);
	});

	it("брои и часовете", () => {
		loadPage(worldTravelling); // 00:16:43
		const timer = document.querySelector("#progressbarEnds span");
		if (timer) timer.textContent = "01:16:43";

		expect(readCountdownMs(document)).toBe(4_603_000);
	});

	it("връща null, когато таймерът липсва или не се чете", () => {
		loadPage(worldNormal);
		expect(readCountdownMs(document)).toBeNull();

		loadPage(worldReturningMission);
		const timer = document.querySelector("#progressbarEnds span");
		if (timer) timer.textContent = "скоро";
		expect(readCountdownMs(document)).toBeNull();
	});
});

describe("readMissionReport", () => {
	it("чете спечелена мисия", () => {
		loadPage(worldMissionWin);

		expect(readMissionReport(document)).toEqual({
			won: true,
			opponent: { id: "GhostTownPhoenix", name: "Феникс" },
			silver: 1163,
			payout: "Стандартна печалба от",
			experience: 5,
			karmaGained: 1,
			damageTaken: 0,
		});
	});

	it("при загуба пази само изхода и противника", () => {
		loadPage(worldMissionWin);
		const shield = document.querySelector(".userShield");
		shield?.classList.replace("winner", "loser");

		expect(readMissionReport(document)).toEqual({
			won: false,
			opponent: { id: "GhostTownPhoenix", name: "Феникс" },
			silver: null,
			payout: null,
			experience: null,
			karmaGained: null,
			damageTaken: null,
		});
	});
});
