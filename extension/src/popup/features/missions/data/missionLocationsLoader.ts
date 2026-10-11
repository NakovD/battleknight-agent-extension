import type { MissionLocationsResult } from "@/common/features/missions/models/missionLocations";

const STUB_DELAY_MS = 600;

/**
 * Stand-in until the world map can actually be read: answers with a made-up
 * city after a short delay, so the popup can be built and tried out.
 *
 * TODO: open /world in the game tab and read the knight's city and its
 * locations there — or one of the reasons it can't be read.
 */
export const loadMissionLocations = (): Promise<MissionLocationsResult> =>
	new Promise((resolve) =>
		setTimeout(
			() =>
				resolve({
					status: "loaded",
					city: "Sample city",
					locations: [
						{ id: "sample-1", name: "Sample location 1" },
						{ id: "sample-2", name: "Sample location 2" },
						{ id: "sample-3", name: "Sample location 3" },
						{ id: "sample-4", name: "Sample location 4" },
					],
				}),
			STUB_DELAY_MS,
		),
	);
