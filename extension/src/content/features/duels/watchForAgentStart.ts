import { DUELS_STORAGE_KEY } from "@/common/features/duels/constants/duelsStateConstants";
import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import { runAgentStep } from "@/content/features/duels/runAgentStep";

const statusOf = (value: unknown) =>
	(value as DuelsExtensionState | undefined)?.status;

/**
 * Starts working as soon as the agent is switched on, without reloading the page.
 *
 * The content script only runs once per page load, so pressing Start while the
 * game was already open used to do nothing until the next navigation. These two
 * triggers close that gap:
 *
 * - the stored state flipping to "running" (that is the Start button), and
 * - the tab being brought to the front, for when the agent was started while
 *   another tab was in focus.
 *
 * runAgentStep checks the state itself and ignores overlapping calls, so both
 * triggers are safe to fire liberally.
 *
 * Returns a function that unsubscribes both listeners.
 */
export const watchForAgentStart = () => {
	const onStorageChanged = (
		changes: Record<string, chrome.storage.StorageChange>,
		areaName: string,
	) => {
		if (areaName !== "local") return;

		const change = changes[DUELS_STORAGE_KEY];
		if (!change) return;

		// Only the moment it starts: the agent writes its own progress to this key
		// while running, and reacting to every write would start a step per write.
		if (
			statusOf(change.newValue) !== "running" ||
			statusOf(change.oldValue) === "running"
		) {
			return;
		}

		void runAgentStep();
	};

	const onVisibilityChange = () => {
		if (document.visibilityState === "visible") void runAgentStep();
	};

	chrome.storage.onChanged.addListener(onStorageChanged);
	document.addEventListener("visibilitychange", onVisibilityChange);

	return () => {
		chrome.storage.onChanged.removeListener(onStorageChanged);
		document.removeEventListener("visibilitychange", onVisibilityChange);
	};
};
