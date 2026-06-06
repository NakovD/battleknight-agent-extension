import { useEffect, useState } from "react";
import { extensionMessenger } from "@/common/features/extensionMessenger";
import type { ExtensionState } from "@/common/models/extenstion";
import { DuelsForm } from "@/popup/features/duels/components/DuelsForm";
import { DuelsStatus } from "@/popup/features/duels/components/DuelsStatus";
import { duelsInitialExtensionState } from "@/popup/features/duels/constants/duelsInitialExtensionState";
import { useDuels } from "@/popup/features/duels/hooks/useDuels";
import { duelsFormValidator } from "@/popup/features/duels/validators/duelsFormValidator";

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
