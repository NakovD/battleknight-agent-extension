import type { IDuelsExtensionController } from "@/background/features/duels/models/duelsExtensionController.ts ";
import type { ChromeStorageMissionsController } from "@/background/features/missions/chromeStorageMissionsController";
import type { MessageHandler } from "@/background/models/messageHandler";
import type { MissionsAgentResponse } from "@/common/features/missions/models/missionsState";
import { missionsAgentMessageValidator } from "@/common/features/missions/validators/missionsStateValidators";

export const DUELS_RUNNING_ERROR =
	"The duels agent is running. Stop it first: both agents drive the same game tab.";

export const createMissionsAgentMessageHandler =
	(
		missions: Pick<
			ChromeStorageMissionsController,
			"start" | "stop" | "getStatus"
		>,
		duels: Pick<IDuelsExtensionController, "getStatus">,
	): MessageHandler =>
	(raw) => {
		const parsed = missionsAgentMessageValidator.safeParse(raw);
		if (!parsed.success) return null;

		const message = parsed.data;

		const handle = async (): Promise<MissionsAgentResponse> => {
			switch (message.type) {
				case "MISSIONS_START":
					if ((await duels.getStatus()).status === "running") {
						return { ok: false, error: DUELS_RUNNING_ERROR };
					}

					await missions.start(message.payload);
					return { ok: true, state: await missions.getStatus() };

				case "MISSIONS_STOP":
					await missions.stop();
					return { ok: true, state: await missions.getStatus() };

				case "MISSIONS_GET_STATUS":
					return { ok: true, state: await missions.getStatus() };
			}
		};

		return handle().catch((err): MissionsAgentResponse => {
			console.error("[background] Missions request failed:", err);
			return { ok: false, error: "Something went wrong. Please try again." };
		});
	};
