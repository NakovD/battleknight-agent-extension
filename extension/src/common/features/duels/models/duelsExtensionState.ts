import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import type { ExtensionState } from "@/common/models/extension";

export type DuelsExtensionState = ExtensionState & {
	settings: DuelsSettings | null;
	attacksToday: number;
	lastAttackAt: string | null;
	waitUntil: number | null;
	currentEnemyName: string | null;
};
