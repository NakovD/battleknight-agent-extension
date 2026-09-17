import type { IAuthSessionStore } from "@/background/features/auth/models/authSessionStore";
import {
	type AuthSession,
	authSessionValidator,
} from "@/common/features/auth/validators/authValidators";

export const AUTH_SESSION_STORAGE_KEY = "authSession";

/**
 * Keeps the session in chrome.storage.local, which is private to the extension and
 * survives browser restarts.
 */
export class ChromeStorageAuthSessionStore implements IAuthSessionStore {
	get(): Promise<AuthSession | null> {
		return new Promise((resolve) => {
			chrome.storage.local.get(AUTH_SESSION_STORAGE_KEY, (result) => {
				// A malformed value (e.g. from an older version) is treated as signed out.
				const session = authSessionValidator.safeParse(
					result[AUTH_SESSION_STORAGE_KEY],
				);

				resolve(session.success ? session.data : null);
			});
		});
	}

	save(session: AuthSession): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.set({ [AUTH_SESSION_STORAGE_KEY]: session }, () =>
				resolve(),
			);
		});
	}

	clear(): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.remove(AUTH_SESSION_STORAGE_KEY, () => resolve());
		});
	}
}
