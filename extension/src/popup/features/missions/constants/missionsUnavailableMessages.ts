import type { MissionsUnavailableReason } from "@/common/features/missions/models/missionLocations";

export const missionsUnavailableMessages: Record<
	MissionsUnavailableReason,
	string
> = {
	traveling: "Your knight is traveling. Try again once they have arrived.",
	working: "Your knight is working. Try again once the work is done.",
	"no-health":
		"Your knight has no hit points left. Try again once they have healed.",
	"returning-from-mission":
		"Your knight is returning from a mission. Try again once they are back.",
	"returning-from-group-mission":
		"Your knight is returning from a group mission. Try again once they are back.",
	"returning-from-duel":
		"Your knight is returning from a duel. Try again once they are back.",
	"world-unreachable":
		"Could not open the world map. Make sure the game is open and you are signed in.",
};
