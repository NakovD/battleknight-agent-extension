import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import type { ExtensionState } from "@/common/models/extension";

export interface IDuelsExtensionController {
	/** Маркира агента като "running" и записва настройките. */
	start(settings: DuelsSettings): Promise<void>;

	/** Маркира агента като "idle". */
	stop(): Promise<void>;

	/** Връща текущото състояние. */
	getStatus(): Promise<ExtensionState>;

	/**
	 * Записва частична промяна в състоянието (напр. от content script-а
	 * след изпълнена стъпка — нова атака, грешка и т.н.)
	 */
	updateStatus(patch: Partial<ExtensionState>): Promise<ExtensionState>;

	/**
	 * Регистрира handler, който се вика при всяка промяна на състоянието.
	 * Връща функция за отписване.
	 */
	onStatusChange(handler: (state: ExtensionState) => void): () => void;
}
