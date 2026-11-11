import { AgentError } from "@/popup/components/common/agent/AgentError";
import { MissionsForm } from "@/popup/features/missions/components/MissionsForm";
import { MissionsStatus } from "@/popup/features/missions/components/MissionsStatus";
import { useMissionLocations } from "@/popup/features/missions/hooks/useMissionLocations";
import { useMissions } from "@/popup/features/missions/hooks/useMissions";
import type { MissionsForm as MissionsFormType } from "@/popup/features/missions/models/missionsForm";

export const Missions = () => {
	const { locationsState, loadLocations } = useMissionLocations();
	const { state, requestError, handleStart, handleStop, handleBack } =
		useMissions();

	if (requestError || state?.status === "error") {
		return (
			<AgentError
				message={requestError ?? state?.errorMessage ?? null}
				onBack={handleBack}
			/>
		);
	}

	if (!state) {
		return <p className="p-4 text-[11px] text-stone-500">Loading...</p>;
	}

	if (state.status === "running") {
		return <MissionsStatus state={state} onStop={handleStop} />;
	}

	const handleSubmit = (values: MissionsFormType) => {
		// The form only enables Start once a location was picked from a loaded map.
		if (locationsState.status !== "loaded") return;

		void handleStart({ ...values, city: locationsState.city });
	};

	return (
		<>
			{/* Why the agent stopped on its own — out of mission points, for one. */}
			{state.errorMessage && (
				<p role="status" className="px-4 pt-3 text-[11px] text-amber-400/90">
					{state.errorMessage}
				</p>
			)}
			<MissionsForm
				locationsState={locationsState}
				onLoadLocations={() => void loadLocations()}
				onSubmit={handleSubmit}
			/>
		</>
	);
};
