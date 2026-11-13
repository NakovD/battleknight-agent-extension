import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import type {
	MissionsState,
	MissionsWait,
} from "@/common/features/missions/models/missionsState";
import {
	findLocationPin,
	findLocationPopup,
	findMissionButton,
	isMissionButtonDisabled,
	readFreeMissionPoints,
	readMissionCost,
} from "@/content/features/missions/missionMap";
import {
	detectMissionPage,
	type MissionReport,
	readCountdownMs,
	readMissionReport,
} from "@/content/features/missions/readMissionPages";

/** On top of the game's countdown, so missions don't start like clockwork. */
export const RANDOM_DELAY_MIN_MS = 15_000;
export const RANDOM_DELAY_MAX_MS = 45_000;

/** Hit points come back on the full hour; a potion can bring them sooner. */
export const HIT_POINTS_RECHECK_MS = 15 * 60_000;
/** The game may take a moment past the hour to hand them out. */
const FULL_HOUR_MARGIN_MS = 60_000;

/** When a countdown is there but can't be read — look again shortly. */
export const RETRY_MS = 60_000;

export type MissionStep =
	| { action: "wait"; wait: MissionsWait }
	| { action: "go-to-world" }
	| { action: "start-mission" }
	| { action: "record"; report: MissionReport }
	| { action: "stop"; reason: string };

interface IStepContext {
	now: number;
	/** 0 ≤ random() < 1, as Math.random. */
	random: () => number;
}

/**
 * Decides the agent's next move from the page the game tab is on. Reads the
 * page, changes nothing: runMissionStep carries the decision out.
 */
export const decideMissionStep = (
	doc: Document,
	state: MissionsState,
	settings: MissionsSettings,
	{ now, random }: IStepContext,
): MissionStep => {
	const page = detectMissionPage(doc);

	// Before any wait: the report is only there once, right after the mission.
	if (page === "report") {
		return state.isMissionPending
			? { action: "record", report: readMissionReport(doc) }
			: { action: "go-to-world" };
	}

	// Still waiting — the page was reloaded, or the tab came back to the front.
	if (state.wait && now < state.wait.until) {
		return { action: "wait", wait: state.wait };
	}

	switch (page) {
		case "countdown": {
			const remainingMs = readCountdownMs(doc);

			if (remainingMs === null) {
				return {
					action: "wait",
					wait: { until: now + RETRY_MS, reason: "retry" },
				};
			}

			const delayMs =
				RANDOM_DELAY_MIN_MS +
				Math.floor(random() * (RANDOM_DELAY_MAX_MS - RANDOM_DELAY_MIN_MS + 1));

			return {
				action: "wait",
				wait: { until: now + remainingMs + delayMs, reason: "returning" },
			};
		}

		case "map":
			return decideOnMap(doc, settings, now);

		default:
			return { action: "go-to-world" };
	}
};

function decideOnMap(
	doc: Document,
	settings: MissionsSettings,
	now: number,
): MissionStep {
	const pin = findLocationPin(doc, settings.location.id);

	if (!pin) {
		const city = doc.querySelector("#contentTitle h1")?.textContent?.trim();

		return {
			action: "stop",
			reason: `${settings.location.name} isn't on this map${city ? ` of ${city}` : ""}. It is in ${settings.city} — has your knight traveled? Load the locations again to choose one here.`,
		};
	}

	const popup = findLocationPopup(doc, pin);
	const button =
		popup && findMissionButton(popup, settings.karma, settings.size);

	if (!button) {
		return {
			action: "stop",
			reason:
				"Could not find the mission's button on the map. The game's layout may have changed.",
		};
	}

	if (!isMissionButtonDisabled(button)) return { action: "start-mission" };

	// Greyed out: short on mission points ends the day; otherwise it is hit
	// points, which come back.
	const cost = readMissionCost(button);
	const points = readFreeMissionPoints(doc);

	if (cost !== null && points !== null && points < cost) {
		return {
			action: "stop",
			reason: `No mission points left for a ${settings.size} mission (${points} left, ${cost} needed). That's all for today.`,
		};
	}

	return {
		action: "wait",
		wait: {
			until: Math.min(
				nextFullHour(now) + FULL_HOUR_MARGIN_MS,
				now + HIT_POINTS_RECHECK_MS,
			),
			reason: "hit-points",
		},
	};
}

const nextFullHour = (now: number) => {
	const date = new Date(now);
	date.setMinutes(60, 0, 0);
	return date.getTime();
};
