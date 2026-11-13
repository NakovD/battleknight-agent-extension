import { readWorldMessageValidator } from "@/common/features/missions/validators/missionLocationsValidators";
import { readWorldPage } from "@/content/features/missions/readWorldPage";

/**
 * Answers the background's "what does the world map say?" once it has brought
 * this tab to /world. Returns a function that stops listening.
 */
export const answerWorldReadRequests = () => {
	const onMessage = (
		raw: unknown,
		_sender: chrome.runtime.MessageSender,
		sendResponse: (response: unknown) => void,
	) => {
		if (!readWorldMessageValidator.safeParse(raw).success) return false;

		sendResponse(readWorldPage());
		return false; // answered synchronously
	};

	chrome.runtime.onMessage.addListener(onMessage);
	return () => chrome.runtime.onMessage.removeListener(onMessage);
};
