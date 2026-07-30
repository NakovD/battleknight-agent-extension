import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";

/**
 * Споделен ключ в chrome.storage.local — background и content script-ът
 * трябва да сочат към едно и също място, иначе никога няма да видят
 * промените, направени от другата страна.
 */
export const DUELS_STORAGE_KEY = "duelsExtensionState";

export const DUELS_INITIAL_EXTENSION_STATE: DuelsExtensionState = {
	status: "idle",
	errorMessage: null,
	settings: null,
	attacksToday: 0,
	lastAttackAt: null,
	waitUntil: null,
	currentEnemyName: null,
};
