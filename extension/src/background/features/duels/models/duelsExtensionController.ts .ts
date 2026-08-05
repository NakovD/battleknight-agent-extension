import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";

export interface IDuelsExtensionController {
	/** Маркира агента като "running" и записва настройките. */
	start(settings: DuelsSettings): Promise<void>;

	/** Маркира агента като "idle". */
	stop(): Promise<void>;

	/** Връща текущото състояние. */
	getStatus(): Promise<DuelsExtensionState>;

	/**
	 * Записва частична промяна в състоянието (напр. от content script-а
	 * след изпълнена стъпка — нова атака, грешка и т.н.)
	 */
	updateStatus(patch: Partial<DuelsExtensionState>): Promise<DuelsExtensionState>;

	/**
	 * Регистрира handler, който се вика при всяка промяна на състоянието.
	 * Връща функция за отписване.
	 */
	onStatusChange(handler: (state: DuelsExtensionState) => void): () => void;
}
