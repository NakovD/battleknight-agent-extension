import { useState } from "react";
import type { MissionLocationsResult } from "@/common/features/missions/models/missionLocations";
import { loadMissionLocations } from "@/popup/features/missions/data/missionLocationsLoader";

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
			setLocationsState(await loadMissionLocations());
		} catch {
			setLocationsState({ status: "unavailable", reason: "world-unreachable" });
		}
	};

	return { locationsState, loadLocations };
};
