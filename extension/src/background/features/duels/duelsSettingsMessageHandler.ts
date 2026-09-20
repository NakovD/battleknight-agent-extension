import type { RemoteDuelsSettingsService } from "@/background/features/duels/remoteDuelsSettingsService";
import { ApiError } from "@/background/models/apiError";
import type { MessageHandler } from "@/background/models/messageHandler";
import {
	type SettingsMessageResponse,
	settingsMessageValidator,
} from "@/common/features/duels/validators/duelsSettingsMessageValidators";

export const createDuelsSettingsMessageHandler =
	(settings: Pick<RemoteDuelsSettingsService, "load" | "save">): MessageHandler =>
	(raw) => {
		const parsed = settingsMessageValidator.safeParse(raw);

		if (!parsed.success) {
			return null;
		}

		const message = parsed.data;

		const handle = async (): Promise<SettingsMessageResponse> => {
			switch (message.type) {
				case "SETTINGS_LOAD":
					return { ok: true, settings: await settings.load() };

				case "SETTINGS_SAVE":
					return { ok: true, settings: await settings.save(message.payload) };
			}
		};

		return handle().catch((err): SettingsMessageResponse => {
			if (err instanceof ApiError) {
				return { ok: false, error: err.message };
			}

			// Anything else is a bug; keep its details out of the popup.
			console.error("[background] Settings request failed:", err);
			return { ok: false, error: "Something went wrong. Please try again." };
		});
	};
