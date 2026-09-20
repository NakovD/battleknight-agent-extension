import { createAuthMessageHandler } from "@/background/features/auth/authMessageHandler";
import { AuthService } from "@/background/features/auth/authService";
import { ChromeStorageAuthSessionStore } from "@/background/features/auth/chromeStorageAuthSessionStore";
import { FetchAuthApiClient } from "@/background/features/auth/fetchAuthApiClient";
import { ChromeStorageAgentController } from "@/background/features/duels/chromeStorageExtensionController";
import { createDuelsMessageHandler } from "@/background/features/duels/duelsMessageHandler";
import { createDuelsSettingsMessageHandler } from "@/background/features/duels/duelsSettingsMessageHandler";
import { FetchDuelsSettingsApiClient } from "@/background/features/duels/fetchDuelsSettingsApiClient";
import { RemoteDuelsSettingsService } from "@/background/features/duels/remoteDuelsSettingsService";
import type { MessageHandler } from "@/background/models/messageHandler";

const controller = new ChromeStorageAgentController();
const sessions = new ChromeStorageAuthSessionStore();

const authService = new AuthService(
	new FetchAuthApiClient(import.meta.env.VITE_API_BASE_URL),
	sessions,
);

const remoteSettings = new RemoteDuelsSettingsService(
	new FetchDuelsSettingsApiClient(import.meta.env.VITE_API_BASE_URL),
	sessions,
);

const messageHandlers: MessageHandler[] = [
	createDuelsMessageHandler(controller),
	createDuelsSettingsMessageHandler(remoteSettings),
	createAuthMessageHandler(authService),
];

chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
	for (const handle of messageHandlers) {
		const reply = handle(raw);

		if (reply) {
			reply.then(sendResponse);
			return true; // отговорът пристига асинхронно
		}
	}

	console.error("[background] Отхвърлено съобщение:", raw);
	return false;
});

// Релей на всяка промяна на състоянието (включително от content script-а,
// който пише директно в chrome.storage) към popup-а, ако е отворен.
controller.onStatusChange((state) => {
	chrome.runtime.sendMessage(
		{
			type: "STATUS_UPDATE",
			payload: {
				status: state.status,
				errorMessage: state.errorMessage,
				settings: state.settings,
			},
		},
		() => void chrome.runtime.lastError, // няма слушащ popup — игнорираме
	);
});
