import {
	discriminatedUnion,
	literal,
	object,
	string,
	enum as zodEnum,
} from "zod";

export const missionLocationValidator = object({
	id: string(),
	name: string(),
});

/**
 * Why the world map can't be used right now. In every one of these the knight
 * is busy or the page is out of reach, so the extension does nothing.
 *
 * - busy: any other wait the game puts the knight in — work, a group mission...
 * - not-enough-points: the game disables every mission button for both hit
 *   points and mission points, without saying which one ran out.
 * - duels-running: loading the map takes over the game tab, which would cut
 *   the duels agent off mid-step.
 */
export const missionsUnavailableReasonValidator = zodEnum([
	"traveling",
	"returning-from-mission",
	"returning-from-duel",
	"busy",
	"not-enough-points",
	"game-not-open",
	"duels-running",
	"world-unreachable",
]);

export const missionLocationsResultValidator = discriminatedUnion("status", [
	object({
		status: literal("loaded"),
		city: string(),
		locations: missionLocationValidator.array(),
	}),
	object({
		status: literal("unavailable"),
		reason: missionsUnavailableReasonValidator,
		/** The game's own title for the page, for waits we don't name ourselves. */
		detail: string().optional(),
	}),
]);

/** Popup → background: take the game tab to /world and read it. */
export const missionsMessageValidator = object({
	type: literal("MISSIONS_LOAD_LOCATIONS"),
});

/** Background → the game tab's content script: read the page you're on. */
export const readWorldMessageValidator = object({
	type: literal("MISSIONS_READ_WORLD"),
});
