import { useState } from "react";
import { missionsMessenger } from "@/common/features/missions/missionsMessenger";
import type { MissionLocationsResult } from "@/common/features/missions/models/missionLocations";

export type MissionLocationsState =
	| { status: "idle" }
	| { status: "loading" }
	| MissionLocationsResult;

export const useMissionLocations = () => {
	const [locationsState, setLocationsState] = useState<MissionLocationsState>({
		status: "idle",
	});

	const loadLocations = async () => {
		setLocationsState({ status: "loading" });

		try {
			setLocationsState(await missionsMessenger.loadLocations());
		} catch {
			setLocationsState({ status: "unavailable", reason: "world-unreachable" });
		}
	};

	return { locationsState, loadLocations };
};
