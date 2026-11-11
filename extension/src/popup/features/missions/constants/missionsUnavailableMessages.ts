import type { MissionsUnavailableReason } from "@/common/features/missions/models/missionLocations";

export const missionsUnavailableMessages: Record<
	MissionsUnavailableReason,
	string
> = {
	traveling: "Your knight is traveling. Try again once they have arrived.",
	"returning-from-mission":
		"Your knight is returning from a mission. Try again once they are back.",
	"returning-from-duel":
		"Your knight is returning from a duel. Try again once they are back.",
	busy: "Your knight is busy. Try again once they are free.",
	"no-mission-points":
		"Your knight has no mission points left for today. Try again once they have come back.",
	"game-not-open":
		"Open the game in a tab first, then load the locations again.",
	"duels-running":
		"The duels agent is using the game tab. Stop it first, so loading the map doesn't interrupt it.",
	"world-unreachable":
		"Could not open the world map. Make sure the game is open and you are signed in.",
};

export const missionsNoHitPointsWarning =
	"Your knight has no hit points right now. You can still start: the extension waits until they come back, from the game or a potion.";
