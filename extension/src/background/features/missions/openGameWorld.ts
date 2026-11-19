import { isGameUrl } from "@/common/features/game/gameUrl";

/**
 * Opens /world afresh in a game tab, on the tab's own server. The tab's agent
 * then takes a step on the new page. Does nothing if the tab is gone or no
 * longer on the game.
 */
export const openGameWorld = async (
	tabId: number,
	tabs: Pick<typeof chrome.tabs, "get" | "update"> = chrome.tabs,
) => {
	const tab = await tabs.get(tabId).catch(() => null);
	if (!tab?.url || !isGameUrl(tab.url)) return;

	await tabs.update(tabId, { url: `${new URL(tab.url).origin}/world` });
};
