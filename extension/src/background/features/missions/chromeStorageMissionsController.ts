import {
	MISSIONS_INITIAL_STATE,
	MISSIONS_STORAGE_KEY,
	parseMissionsState,
	readMissionsState,
	updateMissionsState,
	writeMissionsState,
} from "@/common/features/missions/missionsStateStorage";
import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import type { MissionsState } from "@/common/features/missions/models/missionsState";

/**
 * Starts and stops the missions agent. The agent itself runs in the game tab's
 * content script, which notices the state turning to "running".
 */
export class ChromeStorageMissionsController {
	private listeners = new Set<(state: MissionsState) => void>();

	constructor() {
		// Every write lands here, the content script's included — Chrome reports
		// an extension's own writes too, so there's no need to notify on write.
		chrome.storage.onChanged.addListener((changes, areaName) => {
			if (areaName !== "local" || !(MISSIONS_STORAGE_KEY in changes)) return;

			const state = parseMissionsState(changes[MISSIONS_STORAGE_KEY].newValue);
			for (const listener of this.listeners) listener(state);
		});
	}

	async start(settings: MissionsSettings) {
		const { lastMission } = await readMissionsState();

		// A fresh run: counters, waits and the circuit breaker start over. The
		// last mission stays, so the status screen isn't blank until the first.
		await writeMissionsState({
			...MISSIONS_INITIAL_STATE,
			lastMission,
			status: "running",
			settings,
		});
	}

	async stop() {
		await updateMissionsState({
			status: "idle",
			errorMessage: null,
			wait: null,
			isMissionPending: false,
		});
	}

	getStatus() {
		return readMissionsState();
	}

	onStatusChange(listener: (state: MissionsState) => void) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
}
