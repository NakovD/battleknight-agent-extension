import type { duelsSettingsValidator } from "@/common/features/duels/validators/duelsSettingsValidator";
import type { ExtensionState } from "@/common/models/extension";

export type DuelsExtensionState = ExtensionState<typeof duelsSettingsValidator> & {
	attacksToday: number;
	lastAttackAt: string | null;
	waitUntil: number | null;
	currentEnemyName: string | null;
	/** Рицарят, към чийто дуел навигирахме — нужен, ако играта откаже дуела. */
	currentEnemyId: string | null;
	/**
	 * Рицари, при които играта отказа дуел (страницата /common/error). Пропускат
	 * се при следващия избор, за да не се опитва един и същ противник в кръг.
	 */
	refusedEnemyIds: string[];
	/** Брой последователни навигации без успешна атака — виж circuit breaker-а в runAgentStep. */
	consecutiveNavigations: number;
};
