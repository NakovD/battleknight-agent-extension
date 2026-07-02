import type { DuelsEngineStepType } from "@/content/features/duels/models/duelsEngineStepType";

export interface IDuelsEngineStepResult {
	action: DuelsEngineStepType;
	knightId?: string;
	/** Колко да се изчака преди следващия runStep (ако е приложимо). */
	waitMs?: number;
	won?: boolean;
	enemyName?: string;
}
