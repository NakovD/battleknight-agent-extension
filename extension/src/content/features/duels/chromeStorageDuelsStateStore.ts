import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import type { IDuelsStateStore } from "@/content/features/duels/models/duelsStateStore";

const STORAGE_KEY = "agentState";

const INITIAL_STATE: DuelsExtensionState = {
	status: "idle",
	errorMessage: null,
	settings: null,
	attacksToday: 0,
	lastAttackAt: null,
};

/**
 * Чете/пише състоянието на агента в chrome.storage.local.
 * Споделя ключа с ChromeStorageAgentController от background-а —
 * двата гледат към едно и също "копие на истината".
 */
export class ChromeStorageDuelsStateStore implements IDuelsStateStore {
	async getState(): Promise<DuelsExtensionState> {
		return new Promise((resolve) => {
			chrome.storage.local.get(STORAGE_KEY, (result) => {
				resolve((result[STORAGE_KEY] as DuelsExtensionState) ?? INITIAL_STATE);
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
			chrome.storage.local.set({ [STORAGE_KEY]: next }, () => resolve());
		});
	}
}
