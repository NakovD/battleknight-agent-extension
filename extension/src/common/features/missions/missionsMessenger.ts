import { missionLocationsResultValidator } from "@/common/features/missions/validators/missionLocationsValidators";
import { sendRuntimeMessage } from "@/common/features/runtimeMessaging";

export const missionsMessenger = {
	/** Takes this game tab to /world and reads its locations. */
	loadLocations: (tabId: number) =>
		sendRuntimeMessage(
			{ type: "MISSIONS_LOAD_LOCATIONS", tabId },
			missionLocationsResultValidator,
		),
};
