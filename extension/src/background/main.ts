import { ChromeStorageAgentController } from "@/background/features/duels/chromeStorageExtensionController";
import { duelsSettingsValidator } from "@/common/features/duels/validators/duelsSettingsValidator";
import type { ExtensionMessageResponse } from "@/common/models/extension";
import { getExtensionMessageSchema } from "@/common/validators/extension";

const controller = new ChromeStorageAgentController();
const messageSchema = getExtensionMessageSchema(duelsSettingsValidator);

chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
	const parsed = messageSchema.safeParse(raw);
	if (!parsed.success) {
		console.error("[background] Отхвърлено съобщение:", raw, parsed.error);
		return false;
	}

	const message = parsed.data;

	const handle = async (): Promise<ExtensionMessageResponse> => {
		switch (message.type) {
			case "START_AGENT":
				await controller.start(message.payload);
				return { ok: true, state: await controller.getStatus() };

			case "STOP_AGENT":
				await controller.stop();
				return { ok: true, state: await controller.getStatus() };

			case "GET_STATUS":
				return { ok: true, state: await controller.getStatus() };

			case "STATUS_UPDATE":
				// Background не приема този тип съобщения — само ги излъчва към popup-а
				return { ok: false, error: "Unexpected message type: STATUS_UPDATE" };
		}
	};

	handle()
		.catch(
			(err): ExtensionMessageResponse => ({
				ok: false,
				error: err instanceof Error ? err.message : String(err),
			}),
		)
		.then(sendResponse);

	return true; // отговорът пристига асинхронно
});

// Релей на всяка промяна на състоянието (включително от content script-а,
// който пише директно в chrome.storage) към popup-а, ако е отворен.
controller.onStatusChange((state) => {
	chrome.runtime.sendMessage(
		{
			type: "STATUS_UPDATE",
			payload: { status: state.status, errorMessage: state.errorMessage },
		},
		() => void chrome.runtime.lastError, // няма слушащ popup — игнорираме
	);
});
