import { MISSIONS_STORAGE_KEY } from "@/common/features/missions/missionsStateStorage";
import { runMissionStep } from "@/content/features/missions/runMissionStep";

const statusOf = (value: unknown) =>
	(value as { status?: string } | undefined)?.status;

/**
 * Starts working as soon as the missions agent is switched on, without a page
 * reload — the same two triggers as the duels agent's watchForAgentStart:
 * the state turning to "running", and the tab coming to the front.
 *
 * runMissionStep checks the state itself and ignores overlapping calls, so
 * both are safe to fire liberally. Returns a function that unsubscribes both.
 */
export const watchForMissionsStart = () => {
	const onStorageChanged = (
		changes: Record<string, chrome.storage.StorageChange>,
		areaName: string,
	) => {
		if (areaName !== "local") return;

		const change = changes[MISSIONS_STORAGE_KEY];
		if (!change) return;

		// Only the moment it starts: the agent writes its own progress to this
		// key while running, and reacting to every write would start a step each.
		if (
			statusOf(change.newValue) !== "running" ||
			statusOf(change.oldValue) === "running"
		) {
			return;
		}

		void runMissionStep();
	};

	const onVisibilityChange = () => {
		if (document.visibilityState === "visible") void runMissionStep();
	};

	chrome.storage.onChanged.addListener(onStorageChanged);
	document.addEventListener("visibilitychange", onVisibilityChange);

	return () => {
		chrome.storage.onChanged.removeListener(onStorageChanged);
		document.removeEventListener("visibilitychange", onVisibilityChange);
	};
};
