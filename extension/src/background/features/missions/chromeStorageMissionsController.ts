import {
	MISSIONS_INITIAL_STATE,
	parseMissionsState,
	readAllMissionsStates,
	readMissionsState,
	removeMissionsState,
	tabIdOfMissionsAgentKey,
	updateMissionsState,
	writeMissionsState,
} from "@/common/features/missions/missionsStateStorage";
import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import type { MissionsState } from "@/common/features/missions/models/missionsState";

type StatusListener = (tabId: number, state: MissionsState) => void;

/**
 * Starts and stops each game tab's missions agent. The agent itself runs in
 * that tab's content script, which notices its state turning to "running".
 */
export class ChromeStorageMissionsController {
	private listeners = new Set<StatusListener>();

	constructor() {
		// Every write lands here, the content scripts' included — Chrome reports
		// an extension's own writes too, so there's no need to notify on write.
		chrome.storage.onChanged.addListener((changes, areaName) => {
			if (areaName !== "session") return;

			for (const [key, change] of Object.entries(changes)) {
				const tabId = tabIdOfMissionsAgentKey(key);
				// A removed agent (its tab closed) has nobody left to tell.
				if (tabId === null || change.newValue === undefined) continue;

				const state = parseMissionsState(change.newValue);
				for (const listener of this.listeners) listener(tabId, state);
			}
		});
	}

	async start(tabId: number, settings: MissionsSettings) {
		const { lastMission } = await readMissionsState(tabId);

		// A fresh run: counters, waits and the circuit breaker start over. The
		// last mission stays, so the status screen isn't blank until the first.
		await writeMissionsState(tabId, {
			...MISSIONS_INITIAL_STATE,
			lastMission,
			status: "running",
			settings,
		});
	}

	async stop(tabId: number) {
		await updateMissionsState(tabId, {
			status: "idle",
			errorMessage: null,
			wait: null,
			isMissionPending: false,
		});
	}

	/**
	 * Ends a wait for hit points early — the player may have drunk a potion.
	 * Only that wait: a countdown is the game's, and ending it early would only
	 * start it again. Returns whether there was such a wait to end.
	 */
	async endHitPointsWait(tabId: number) {
		const state = await readMissionsState(tabId);

		if (state.status !== "running" || state.wait?.reason !== "hit-points") {
			return false;
		}

		await updateMissionsState(tabId, {
			wait: null,
			// The reload that follows is one more page change.
			consecutiveNavigations: state.consecutiveNavigations + 1,
		});
		return true;
	}

	getStatus(tabId: number) {
		return readMissionsState(tabId);
	}

	/** The tab is gone, and its agent with it. */
	remove(tabId: number) {
		return removeMissionsState(tabId);
	}

	/** Whether any tab's agent is running. */
	async isAnyRunning() {
		const states = await readAllMissionsStates();
		return [...states.values()].some((state) => state.status === "running");
	}

	onStatusChange(listener: StatusListener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
}
