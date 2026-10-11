import { MissionsForm } from "@/popup/features/missions/components/MissionsForm";
import { useMissionLocations } from "@/popup/features/missions/hooks/useMissionLocations";
import type { MissionsForm as MissionsFormType } from "@/popup/features/missions/models/missionsForm";

export const Missions = () => {
	const { locationsState, loadLocations } = useMissionLocations();

	// TODO: hand the settings to the agent once missions can actually run.
	const handleSubmit = (_values: MissionsFormType) => {};

	return (
		<MissionsForm
			locationsState={locationsState}
			onLoadLocations={() => void loadLocations()}
			onSubmit={handleSubmit}
		/>
	);
};
