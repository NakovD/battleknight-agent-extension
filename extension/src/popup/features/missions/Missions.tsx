import { MissionsForTab } from "@/popup/features/missions/components/MissionsForTab";
import { useActiveGameTab } from "@/popup/hooks/useActiveGameTab";

/**
 * Missions run per game tab, so the popup shows the agent of the tab it was
 * opened over — one account's, when two are open side by side.
 */
export const Missions = () => {
	const activeTab = useActiveGameTab();

	if (activeTab.status === "loading") {
		return <p className="p-4 text-[11px] text-stone-500">Loading...</p>;
	}

	if (activeTab.status === "none") {
		return (
			<p role="status" className="p-4 text-[11px] text-amber-400/90">
				Open this popup over the game tab you want missions in. Each game tab
				runs its own missions.
			</p>
		);
	}

	// Keyed by tab, so nothing of one tab's agent can linger into another's.
	return (
		<MissionsForTab
			key={activeTab.tabId}
			tabId={activeTab.tabId}
			host={activeTab.host}
		/>
	);
};
