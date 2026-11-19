import { tabIdOfMissionsAgentKey } from "@/common/features/missions/missionsStateStorage";
import { runMissionStep } from "@/content/features/missions/runMissionStep";

const statusOf = (value: unknown) =>
	(value as { status?: string } | undefined)?.status;

/**
 * Starts working as soon as the missions agent is switched on, without a page
 * reload — the same two triggers as the duels agent's watchForAgentStart:
 * the state turning to "running", and the tab coming to the front.
 *
 * Any tab's agent starting wakes every game tab: telling them apart would need
 * this tab's id up front. runMissionStep reads its own tab's state and does
 * nothing if that isn't running, and it ignores overlapping calls, so both
 * triggers are safe to fire liberally. Returns a function that unsubscribes both.
 */
export const watchForMissionsStart = () => {
	const onStorageChanged = (
		changes: Record<string, chrome.storage.StorageChange>,
		areaName: string,
	) => {
		if (areaName !== "session") return;

		// Only the moment one starts: agents write their own progress while
		// running, and reacting to every write would start a step each.
		const hasStarted = Object.entries(changes).some(
			([key, change]) =>
				tabIdOfMissionsAgentKey(key) !== null &&
				statusOf(change.newValue) === "running" &&
				statusOf(change.oldValue) !== "running",
		);

		if (hasStarted) void runMissionStep();
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
