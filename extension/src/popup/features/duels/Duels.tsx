import { DuelsError } from "@/popup/features/duels/components/DuelsError";
import { DuelsForm } from "@/popup/features/duels/components/DuelsForm";
import { DuelsStatus } from "@/popup/features/duels/components/DuelsStatus";
import { useDuels } from "@/popup/features/duels/hooks/useDuels";

export const Duels = () => {
	const {
		isRunning,
		isError,
		duelsSettings,
		errorMessage,
		handleSubmit,
		handleStop,
		handleRetry,
		handleBack,
	} = useDuels();

	if (isRunning && duelsSettings) {
		return <DuelsStatus settings={duelsSettings} onStop={handleStop} />;
	}

	if (isError) {
		return (
			<DuelsError
				message={errorMessage}
				onRetry={duelsSettings ? handleRetry : undefined}
				onBack={handleBack}
			/>
		);
	}

	return <DuelsForm onSubmit={handleSubmit} />;
};
