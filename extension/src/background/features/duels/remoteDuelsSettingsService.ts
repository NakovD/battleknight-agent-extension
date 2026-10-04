import type { IAuthSessionStore } from "@/background/features/auth/models/authSessionStore";
import type { IDuelsSettingsApiClient } from "@/background/features/duels/models/duelsSettingsApiClient";
import { UnauthorizedApiError } from "@/background/models/apiError";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";

/**
 * Syncs duels settings with the API for whoever is signed in.
 *
 * Returns null when nobody is signed in, so the popup keeps using its local
 * settings — an account is optional.
 */
export class RemoteDuelsSettingsService {
	constructor(
		private readonly api: IDuelsSettingsApiClient,
		private readonly sessions: IAuthSessionStore,
	) {}

	load(): Promise<DuelsSettings | null> {
		return this.withSession((accessToken) => this.api.get(accessToken));
	}

	save(settings: DuelsSettings): Promise<DuelsSettings | null> {
		return this.withSession((accessToken) => this.api.save(accessToken, settings));
	}

	private async withSession(
		call: (accessToken: string) => Promise<DuelsSettings | null>,
	): Promise<DuelsSettings | null> {
		const session = await this.sessions.get();

		if (!session) {
			return null;
		}

		try {
			return await call(session.accessToken);
		} catch (error) {
			// The token is gone or no longer valid; drop it so the popup shows the
			// sign-in form instead of failing on every request.
			if (error instanceof UnauthorizedApiError) {
				await this.sessions.clear();
				return null;
			}

			throw error;
		}
	}
}
