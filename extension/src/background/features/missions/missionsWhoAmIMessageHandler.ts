import type { MessageHandler } from "@/background/models/messageHandler";
import { missionsWhoAmIMessageValidator } from "@/common/features/missions/validators/missionsStateValidators";

/**
 * Tells a game tab's content script its tab id: it can't find out by itself,
 * and needs it to find its own agent's state.
 *
 * Waits for storageReady first. The content script reads chrome.storage.session
 * right after this answer, and that only works once the background has opened
 * it up to content scripts.
 */
export const createMissionsWhoAmIMessageHandler =
	(storageReady: Promise<unknown>): MessageHandler =>
	(raw, sender) => {
		if (!missionsWhoAmIMessageValidator.safeParse(raw).success) return null;

		const tabId = sender?.tab?.id;
		// Only a tab's content script has a tab to name.
		if (tabId === undefined) return null;

		return storageReady.then(() => ({ tabId }));
	};
