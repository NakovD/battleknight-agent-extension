import { missionLocationsResultValidator } from "@/common/features/missions/validators/missionLocationsValidators";
import { sendRuntimeMessage } from "@/common/features/runtimeMessaging";

export const missionsMessenger = {
	loadLocations: () =>
		sendRuntimeMessage(
			{ type: "MISSIONS_LOAD_LOCATIONS" },
			missionLocationsResultValidator,
		),
};
