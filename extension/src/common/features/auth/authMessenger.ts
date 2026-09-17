import {
	type AuthMessage,
	authMessageResponseValidator,
} from "@/common/features/auth/validators/authValidators";
import { sendRuntimeMessage } from "@/common/features/runtimeMessaging";

export const authMessenger = {
	send: (message: AuthMessage) =>
		sendRuntimeMessage(message, authMessageResponseValidator),
};
