import type { AuthService } from "@/background/features/auth/authService";
import { AuthApiError } from "@/background/features/auth/models/authApiClient";
import type { MessageHandler } from "@/background/models/messageHandler";
import {
	type AuthMessageResponse,
	authMessageValidator,
} from "@/common/features/auth/validators/authValidators";

const isAuthMessage = (raw: unknown) =>
	typeof raw === "object" &&
	raw !== null &&
	"type" in raw &&
	typeof raw.type === "string" &&
	raw.type.startsWith("AUTH_");

export const createAuthMessageHandler =
	(auth: Pick<AuthService, "register" | "login" | "logout" | "getAccount">): MessageHandler =>
	(raw) => {
		if (!isAuthMessage(raw)) {
			return null;
		}

		const parsed = authMessageValidator.safeParse(raw);

		// Ours, but malformed — answer rather than leaving the popup waiting on a
		// closed message port.
		if (!parsed.success) {
			return Promise.resolve<AuthMessageResponse>({
				ok: false,
				error: "Invalid request.",
			});
		}

		const message = parsed.data;

		const handle = async (): Promise<AuthMessageResponse> => {
			switch (message.type) {
				case "AUTH_REGISTER":
					return { ok: true, account: await auth.register(message.payload) };

				case "AUTH_LOGIN":
					return { ok: true, account: await auth.login(message.payload) };

				case "AUTH_LOGOUT":
					return { ok: true, account: await auth.logout() };

				case "AUTH_GET_ACCOUNT":
					return { ok: true, account: await auth.getAccount() };
			}
		};

		return handle().catch((err): AuthMessageResponse => {
			if (err instanceof AuthApiError) {
				return { ok: false, error: err.message };
			}

			// Anything else is a bug; keep its details out of the popup.
			console.error("[background] Auth request failed:", err);
			return { ok: false, error: "Something went wrong. Please try again." };
		});
	};
