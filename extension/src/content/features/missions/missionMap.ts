import type {
	MissionKarma,
	MissionSize,
} from "@/common/features/missions/models/missionsSettings";

/**
 * Reading the world map's mission popups. Each location pin on the map points
 * (through rel) at a popup hidden in #squeezeBoxContent, which holds the
 * location's name and a button per karma and size.
 */

/** The map pin for a location, by the id the game itself submits. */
export const findLocationPin = (doc: Document, locationId: string) => {
	const pin = doc.getElementById(locationId);

	return pin?.matches("#mapBase a.mission") ? (pin as HTMLAnchorElement) : null;
};

/**
 * By id rather than selector: an opened popup is copied into the page without
 * its ids, and that copy must never be read in place of the original.
 */
export const findLocationPopup = (doc: Document, pin: HTMLAnchorElement) => {
	const popupId = pin.getAttribute("rel")?.replace(/^#/, "");

	return popupId ? doc.getElementById(popupId) : null;
};

export const readLocationName = (popup: Element) =>
	popup.querySelector(".missionName h3")?.textContent?.trim() || null;

const karmaColumns: Record<MissionKarma, string> = {
	light: ".goodMission",
	dark: ".evilMission",
};

const sizeButtons: Record<MissionSize, string> = {
	small: ".devSmall",
	medium: ".devMedium",
	large: ".devLarge",
};

export const findMissionButton = (
	popup: Element,
	karma: MissionKarma,
	size: MissionSize,
) =>
	popup.querySelector<HTMLElement>(
		`${karmaColumns[karma]} ${sizeButtons[size]}`,
	);

export const isMissionButtonDisabled = (button: Element) =>
	button.classList.contains("disabledSpecialBtn");

/** The mission's cost in mission points, from the button: "Малка: 20 ТМ". */
export const readMissionCost = (button: Element) =>
	readNumber(button.textContent);

/** The free mission points. Every popup repeats them, so the first will do. */
export const readFreeMissionPoints = (doc: Document) =>
	readNumber(
		doc.querySelector("#squeezeBoxContent .missionPoints span")?.textContent,
	);

export const allMissionButtons = (doc: Document) =>
	Array.from(doc.querySelectorAll("#squeezeBoxContent .specialButton"));

/** The only number in a translated sentence — the words differ per language. */
const readNumber = (text: string | null | undefined) => {
	const digits = text?.replace(/\D/g, "");
	return digits ? Number(digits) : null;
};
