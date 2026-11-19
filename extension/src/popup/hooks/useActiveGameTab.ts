import { useEffect, useState } from "react";
import { isGameUrl } from "@/common/features/game/gameUrl";

export type ActiveGameTab =
	| { status: "loading" }
	/** The popup was opened over something other than the game. */
	| { status: "none" }
	| { status: "game"; tabId: number; host: string };

/**
 * The game tab the popup was opened over. Agents run per tab, so this is the
 * tab the popup shows and controls.
 */
export const useActiveGameTab = () => {
	const [activeTab, setActiveTab] = useState<ActiveGameTab>({
		status: "loading",
	});

	useEffect(() => {
		chrome.tabs
			.query({ active: true, currentWindow: true })
			.then(([tab]) => {
				setActiveTab(
					tab?.id !== undefined && tab.url && isGameUrl(tab.url)
						? { status: "game", tabId: tab.id, host: new URL(tab.url).host }
						: { status: "none" },
				);
			})
			.catch(() => setActiveTab({ status: "none" }));
	}, []);

	return activeTab;
};
