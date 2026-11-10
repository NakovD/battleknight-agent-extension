import type {
	MissionLocation,
	MissionLocationsResult,
	MissionsUnavailableReason,
} from "@/common/features/missions/models/missionLocations";

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

	if (areAllMissionsDisabled(doc)) {
		return { status: "unavailable", reason: "not-enough-points" };
	}

	return { status: "loaded", city: title, locations: readLocations(doc) };
};

function readLocations(doc: Document): MissionLocation[] {
	return Array.from(
		doc.querySelectorAll<HTMLAnchorElement>("#mapBase a.mission[id]"),
	).map((anchor) => ({
		// The id is what the game's own chooseMission() submits for the location.
		id: anchor.id,
		name: readLocationName(doc, anchor) ?? anchor.id,
	}));
}

/**
 * The map pins carry no text; the name is in the popup their rel points at.
 * By id rather than selector: an opened popup is copied into the page without
 * its ids, and that copy must not be read as another location.
 */
function readLocationName(doc: Document, anchor: HTMLAnchorElement) {
	const popupId = anchor.getAttribute("rel")?.replace(/^#/, "");
	if (!popupId) return null;

	return (
		doc
			.getElementById(popupId)
			?.querySelector(".missionName h3")
			?.textContent?.trim() || null
	);
}

/**
 * Only when every button is off: with few mission points left the larger
 * missions go grey first, while a small one can still be done.
 */
function areAllMissionsDisabled(doc: Document) {
	const buttons = Array.from(
		doc.querySelectorAll("#squeezeBoxContent .specialButton"),
	);

	return (
		buttons.length > 0 &&
		buttons.every((button) => button.classList.contains("disabledSpecialBtn"))
	);
}
