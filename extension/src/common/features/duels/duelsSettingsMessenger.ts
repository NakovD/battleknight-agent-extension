import {
	type SettingsMessage,
	settingsMessageResponseValidator,
} from "@/common/features/duels/validators/duelsSettingsMessageValidators";
import { sendRuntimeMessage } from "@/common/features/runtimeMessaging";

export const duelsSettingsMessenger = {
	send: (message: SettingsMessage) =>
		sendRuntimeMessage(message, settingsMessageResponseValidator),
};
