import type { MissionLocation } from "@/common/features/missions/models/missionLocations";
import type {
	MissionKarma,
	MissionSize,
} from "@/popup/features/missions/models/missionsForm";

export const missionsFormDefaultValues = {
	location: null as MissionLocation | null,
	karma: "light" as MissionKarma,
	size: "small" as MissionSize,
	cooldownMinutes: 10,
};
