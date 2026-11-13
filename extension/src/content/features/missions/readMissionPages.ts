import type { MissionRecord } from "@/common/features/missions/models/missionsState";

/** What a report says; the runner adds when, where and which mission. */
export type MissionReport = Pick<
	MissionRecord,
	| "won"
	| "opponent"
	| "silver"
	| "payout"
	| "experience"
	| "karmaGained"
	| "damageTaken"
>;

export type MissionPage = "map" | "report" | "countdown" | "other";

/**
 * Which page the game tab is on, as far as missions care.
 *
 * The report asks for #missionText too: a duel's result is a .fightResult
 * page as well, and must never be recorded as a mission.
 */
export const detectMissionPage = (doc: Document): MissionPage => {
	const main = doc.querySelector("#mainContent");
	if (!main) return "other";

	if (main.classList.contains("location")) return "map";

	if (main.classList.contains("fightResult")) {
		return doc.querySelector("#missionText") ? "report" : "other";
	}

	return Array.from(main.classList).some((name) => name.startsWith("cooldown"))
		? "countdown"
		: "other";
};

/** The countdown's time left, from "00:01:51". Null if it can't be read. */
export const readCountdownMs = (doc: Document) => {
	const text = doc.querySelector("#progressbarEnds span")?.textContent?.trim();
	const match = text?.match(/^(\d+):(\d{2}):(\d{2})$/);
	if (!match) return null;

	const [, hours, minutes, seconds] = match.map(Number);
	return ((hours * 60 + minutes) * 60 + seconds) * 1000;
};

/**
 * Reads a mission report. The sentences are translated, so the figures are
 * found by position and by structure, never by wording:
 *
 * - won or lost: the knight's shield is marked winner or loser;
 * - the opponent: #challengerImage, whose class names the creature the same
 *   way in every language;
 * - the paragraphs before the divider: silver, experience, karma;
 * - the paragraphs after it: damage by the attacker, then by the defender.
 *   The knight attacks in a mission, so the defender's is what they took.
 *
 * For a loss only the outcome and the opponent are read: we have no saved
 * report of one, and guessing its layout would store wrong figures.
 */
export const readMissionReport = (doc: Document): MissionReport => {
	const won =
		doc.querySelector(".userShield")?.classList.contains("winner") ?? false;
	const challenger = doc.querySelector("#challengerImage");

	const opponent = {
		id: challenger?.classList[0] ?? null,
		name: challenger?.querySelector("h2")?.textContent?.trim() || null,
	};

	if (!won) {
		return {
			won,
			opponent,
			silver: null,
			payout: null,
			experience: null,
			karmaGained: null,
			damageTaken: null,
		};
	}

	const inner = doc.querySelector(".fightResultsInner");
	const paragraphs = Array.from(inner?.children ?? []);
	const dividerAt = paragraphs.findIndex((element) =>
		element.classList.contains("divider"),
	);
	const rewards = paragraphs
		.slice(0, dividerAt === -1 ? undefined : dividerAt)
		.filter((element) => element.tagName === "P");
	const damage =
		dividerAt === -1
			? []
			: paragraphs
					.slice(dividerAt + 1)
					.filter((element) => element.tagName === "P");

	return {
		won,
		opponent,
		silver: readEmphasised(rewards[0]),
		// "Стандартна печалба от" — the words around the amount name the payout.
		payout: rewards[0]?.firstChild?.textContent?.trim() || null,
		experience: readEmphasised(rewards[1]),
		karmaGained: readEmphasised(rewards[2]),
		damageTaken: readEmphasised(damage[1]),
	};
};

const readEmphasised = (paragraph: Element | undefined) => {
	const digits = paragraph
		?.querySelector("em")
		?.textContent?.replace(/\D/g, "");
	return digits ? Number(digits) : null;
};
