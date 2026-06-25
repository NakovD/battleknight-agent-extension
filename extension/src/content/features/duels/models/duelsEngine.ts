import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import type { IDuelsEngineStepResult } from "@/content/features/duels/models/duelsEngineStepResult";

/**
 * Изпълнява една стъпка от логиката на дуелите въз основа на текущата страница.
 *
 * Чист (без I/O към storage) — получава настройки, гледа текущия DOM,
 * връща резултат. Извикващият код (content/index.ts) отговаря за
 * проверка дали трябва да се извика, и за записване на резултата.
 */
export interface IDuelsEngine {
	runStep(settings: DuelsSettings): Promise<IDuelsEngineStepResult>;
}
