import type { duelsSettingsValidator } from "@/common/features/duels/validators/duelsSettingsValidator";
import type { ExtensionState } from "@/common/models/extension";

export type DuelsExtensionState = ExtensionState<typeof duelsSettingsValidator> & {
	attacksToday: number;
	lastAttackAt: string | null;
	waitUntil: number | null;
	currentEnemyName: string | null;
};
