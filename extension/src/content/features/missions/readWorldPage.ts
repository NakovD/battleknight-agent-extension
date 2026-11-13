import type {
	MissionLocation,
	MissionLocationsResult,
	MissionsUnavailableReason,
} from "@/common/features/missions/models/missionLocations";
import {
	allMissionButtons,
	findLocationPopup,
	isMissionButtonDisabled,
	readFreeMissionPoints,
	readLocationName,
	readMissionCost,
} from "@/content/features/missions/missionMap";

/**
 * While the knight is away, /world shows a countdown instead of the map, and
 * #mainContent carries a class naming the wait.
 */
const waitReasons: Record<string, MissionsUnavailableReason> = {
	cooldownTravel: "traveling",
	cooldownFight: "returning-from-mission",
	cooldownDuel: "returning-from-duel",
};

/**
 * Reads the knight's city and its mission locations from the world page — or
 * why they can't be used right now.
 */
export const readWorldPage = (
	doc: Document = document,
): MissionLocationsResult => {
	const main = doc.querySelector("#mainContent");
	const title = doc.querySelector("#contentTitle h1")?.textContent?.trim();

	if (!main) return { status: "unavailable", reason: "world-unreachable" };

	const waitClass = Array.from(main.classList).find((name) =>
		name.startsWith("cooldown"),
	);

	if (waitClass) {
		return {
			status: "unavailable",
			// Waits we have no sample of — work, a group mission — still read as
			// busy, in the game's own words.
			reason: waitReasons[waitClass] ?? "busy",
			...(title ? { detail: title } : {}),
		};
	}

	if (!main.classList.contains("location") || !title) {
		return { status: "unavailable", reason: "world-unreachable" };
	}

	const locations = readLocations(doc);

	switch (readMissionsBlocker(doc)) {
		case "no-mission-points":
			return { status: "unavailable", reason: "no-mission-points" };

		case "no-hit-points":
			// Hit points come back on their own, so the agent can be set up now
			// and wait for them.
			return {
				status: "loaded",
				city: title,
				locations,
				warning: "no-hit-points",
			};

		default:
			return { status: "loaded", city: title, locations };
	}
};

function readLocations(doc: Document): MissionLocation[] {
	return Array.from(
		doc.querySelectorAll<HTMLAnchorElement>("#mapBase a.mission[id]"),
	).map((anchor) => {
		const popup = findLocationPopup(doc, anchor);

		return {
			// The id is what the game's own chooseMission() submits for the location.
			id: anchor.id,
			name: (popup && readLocationName(popup)) ?? anchor.id,
		};
	});
}

/**
 * The game disables every mission button both when hit points and when
 * mission points run out, without saying which. Only when every button is
 * off: with few points left the larger missions go grey first, while a small
 * one can still be done.
 *
 * Short on points means the cheapest mission costs more than what's left;
 * anything else disabling them all is hit points.
 */
function readMissionsBlocker(doc: Document) {
	const buttons = allMissionButtons(doc);

	if (buttons.length === 0 || !buttons.every(isMissionButtonDisabled)) {
		return null;
	}

	const costs = buttons
		.map(readMissionCost)
		.filter((cost): cost is number => cost !== null);
	const points = readFreeMissionPoints(doc);

	// Unreadable numbers fall to hit points: waiting for them is harmless,
	// while stopping for missing points would end the day by mistake.
	if (points === null || costs.length === 0) return "no-hit-points";

	return points < Math.min(...costs) ? "no-mission-points" : "no-hit-points";
}
