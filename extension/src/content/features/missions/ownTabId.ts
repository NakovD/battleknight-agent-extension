import { missionsWhoAmIResponseValidator } from "@/common/features/missions/validators/missionsStateValidators";
import { sendRuntimeMessage } from "@/common/features/runtimeMessaging";

let ownTabId: Promise<number> | null = null;

/**
 * This game tab's id. A content script can't learn it by itself, so it asks
 * the background once per page and keeps the answer; a failed ask is retried
 * the next time.
 */
export const getOwnTabId = () => {
	ownTabId ??= sendRuntimeMessage(
		{ type: "MISSIONS_WHO_AM_I" },
		missionsWhoAmIResponseValidator,
	)
		.then(({ tabId }) => tabId)
		.catch((error: unknown) => {
			ownTabId = null;
			throw error;
		});

	return ownTabId;
};
