import { DuelsForm } from "@/popup/features/duels/components/DuelsForm";
import { DuelsStatus } from "@/popup/features/duels/components/DuelsStatus";
import { useDuels } from "@/popup/features/duels/hooks/useDuels";

export const Duels = () => {
	const { isRunning, duelsSettings, handleSubmit, handleStop } = useDuels();

	return (
		<div className="w-full">
			{isRunning && duelsSettings && (
				<DuelsStatus settings={duelsSettings} onStop={handleStop} />
			)}
			{!isRunning && <DuelsForm onSubmit={handleSubmit} />}
		</div>
	);
};
