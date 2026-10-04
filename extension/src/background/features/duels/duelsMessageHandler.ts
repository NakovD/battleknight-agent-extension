import type { IDuelsExtensionController } from "@/background/features/duels/models/duelsExtensionController.ts ";
import type { MessageHandler } from "@/background/models/messageHandler";
import { duelsSettingsValidator } from "@/common/features/duels/validators/duelsSettingsValidator";
import type { ExtensionMessageResponse } from "@/common/models/extension";
import { getExtensionMessageSchema } from "@/common/validators/extension";

type DuelsResponse = ExtensionMessageResponse<typeof duelsSettingsValidator>;

const messageSchema = getExtensionMessageSchema(duelsSettingsValidator);

export const createDuelsMessageHandler =
	(controller: IDuelsExtensionController): MessageHandler =>
	(raw) => {
		const parsed = messageSchema.safeParse(raw);

		if (!parsed.success) {
			return null;
		}

		const message = parsed.data;

		const handle = async (): Promise<DuelsResponse> => {
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

		return handle().catch(
			(err): DuelsResponse => ({
				ok: false,
				error: err instanceof Error ? err.message : String(err),
			}),
		);
	};
