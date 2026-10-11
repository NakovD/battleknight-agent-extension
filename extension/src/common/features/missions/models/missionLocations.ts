export interface MissionLocation {
	id: string;
	name: string;
}

/**
 * Why the world map can't be read right now. In every one of these the knight
 * is busy or the page is out of reach, so the extension does nothing.
 */
export type MissionsUnavailableReason =
	| "traveling"
	| "working"
	| "no-health"
	| "returning-from-mission"
	| "returning-from-group-mission"
	| "returning-from-duel"
	| "world-unreachable";

export type MissionLocationsResult =
	| { status: "loaded"; city: string; locations: MissionLocation[] }
	| { status: "unavailable"; reason: MissionsUnavailableReason };
