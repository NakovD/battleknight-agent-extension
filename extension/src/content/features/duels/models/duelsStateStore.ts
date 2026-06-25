import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";

/**
 * Достъп до текущото намерение/състояние на агента.
 * Ползва се от content script-а за да прочита настройки и да докладва прогрес.
 *
 * Имплементациите могат да четат/пишат локално (chrome.storage)
 * или отдалечено (.NET backend), без да се променя кодът който ги ползва.
 */
export interface IDuelsStateStore {
	/** Текущото пълно състояние. */
	getState(): Promise<DuelsExtensionState>;

	/** Бързо помощно — true ако агентът трябва да работи в момента. */
	isRunning(): Promise<boolean>;

	/** Текущите настройки, или null ако няма зададени. */
	getSettings(): Promise<DuelsSettings | null>;

	/** Записва частична промяна (нова атака, грешка, и т.н.) */
	reportProgress(patch: Partial<DuelsExtensionState>): Promise<void>;
}
