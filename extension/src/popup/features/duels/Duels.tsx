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
		areSettingsLoaded,
		savedFormValues,
		syncWarning,
		handleSubmit,
		handleStop,
		handleRetry,
		handleBack,
	} = useDuels();

	if (isRunning && duelsSettings) {
		return (
			<DuelsStatus
				settings={duelsSettings}
				warning={syncWarning}
				onStop={handleStop}
			/>
		);
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

	// The form reads its starting values once, so it must not render before the
	// account's saved settings have been fetched.
	if (!areSettingsLoaded) {
		return <p className="p-4 text-[11px] text-stone-500">Loading settings...</p>;
	}

	return (
		<>
			{/* Why the agent stopped on its own — otherwise it looks like it never ran. */}
			{errorMessage && (
				<p role="status" className="px-4 pt-3 text-[11px] text-amber-400/90">
					{errorMessage}
				</p>
			)}
			{syncWarning && (
				<p role="alert" className="px-4 pt-3 text-[11px] text-amber-500/80">
					{syncWarning}
				</p>
			)}
			<DuelsForm onSubmit={handleSubmit} defaultValues={savedFormValues} />
		</>
	);
};
