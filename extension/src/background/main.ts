import { createAuthMessageHandler } from "@/background/features/auth/authMessageHandler";
import { AuthService } from "@/background/features/auth/authService";
import { ChromeStorageAuthSessionStore } from "@/background/features/auth/chromeStorageAuthSessionStore";
import { FetchAuthApiClient } from "@/background/features/auth/fetchAuthApiClient";
import { ChromeStorageAgentController } from "@/background/features/duels/chromeStorageExtensionController";
import { createDuelsMessageHandler } from "@/background/features/duels/duelsMessageHandler";
import { createDuelsSettingsMessageHandler } from "@/background/features/duels/duelsSettingsMessageHandler";
import { FetchDuelsSettingsApiClient } from "@/background/features/duels/fetchDuelsSettingsApiClient";
import { RemoteDuelsSettingsService } from "@/background/features/duels/remoteDuelsSettingsService";
import { ChromeStorageMissionsController } from "@/background/features/missions/chromeStorageMissionsController";
import { GameTabWorldMapReader } from "@/background/features/missions/gameTabWorldMapReader";
import { createMissionsAgentMessageHandler } from "@/background/features/missions/missionsAgentMessageHandler";
import { createMissionsMessageHandler } from "@/background/features/missions/missionsMessageHandler";
import type { MessageHandler } from "@/background/models/messageHandler";

const controller = new ChromeStorageAgentController();
const sessions = new ChromeStorageAuthSessionStore();
const missionsController = new ChromeStorageMissionsController();

const authService = new AuthService(
	new FetchAuthApiClient(import.meta.env.VITE_API_BASE_URL),
	sessions,
);

const remoteSettings = new RemoteDuelsSettingsService(
	new FetchDuelsSettingsApiClient(import.meta.env.VITE_API_BASE_URL),
	// The auth service hands out access tokens and renews them when they age out.
	authService,
);

const messageHandlers: MessageHandler[] = [
	createDuelsMessageHandler(controller, async () =>
		(await missionsController.getStatus()).status === "running"
			? "The missions agent is running. Stop it first: both agents drive the same game tab."
			: null,
	),
	createDuelsSettingsMessageHandler(remoteSettings),
	createAuthMessageHandler(authService),
	createMissionsMessageHandler(new GameTabWorldMapReader(), controller),
	createMissionsAgentMessageHandler(missionsController, controller),
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

missionsController.onStatusChange((state) => {
	chrome.runtime.sendMessage(
		{ type: "MISSIONS_STATUS_UPDATE", payload: state },
		() => void chrome.runtime.lastError, // няма слушащ popup — игнорираме
	);
});
