import {
	DUELS_INITIAL_EXTENSION_STATE,
	DUELS_STORAGE_KEY,
} from "@/common/features/duels/constants/duelsStateConstants";
import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import type { IDuelsStateStore } from "@/content/features/duels/models/duelsStateStore";

/**
 * Чете/пише състоянието на агента в chrome.storage.local.
 * Споделя ключа с ChromeStorageAgentController от background-а —
 * двата гледат към едно и също "копие на истината".
 */
export class ChromeStorageDuelsStateStore implements IDuelsStateStore {
	async getState(): Promise<DuelsExtensionState> {
		return new Promise((resolve) => {
			chrome.storage.local.get(DUELS_STORAGE_KEY, (result) => {
				resolve(
					(result[DUELS_STORAGE_KEY] as DuelsExtensionState) ??
						DUELS_INITIAL_EXTENSION_STATE,
				);
			});
		});
	}

	async isRunning(): Promise<boolean> {
		const state = await this.getState();
		return state.status === "running";
	}

	async getSettings(): Promise<DuelsSettings | null> {
		const state = await this.getState();
		return state.settings;
	}

	async reportProgress(patch: Partial<DuelsExtensionState>): Promise<void> {
		const current = await this.getState();
		const next: DuelsExtensionState = { ...current, ...patch };
		return new Promise((resolve) => {
			chrome.storage.local.set({ [DUELS_STORAGE_KEY]: next }, () => resolve());
		});
	}
}
