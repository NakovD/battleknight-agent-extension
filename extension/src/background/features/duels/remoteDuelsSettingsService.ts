import type { IAccessTokenProvider } from "@/background/features/auth/models/accessTokenProvider";
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
		private readonly tokens: IAccessTokenProvider,
	) {}

	load(): Promise<DuelsSettings | null> {
		return this.withSession((accessToken) => this.api.get(accessToken));
	}

	save(settings: DuelsSettings): Promise<DuelsSettings | null> {
		return this.withSession((accessToken) =>
			this.api.save(accessToken, settings),
		);
	}

	private async withSession(
		call: (accessToken: string) => Promise<DuelsSettings | null>,
	): Promise<DuelsSettings | null> {
		const accessToken = await this.tokens.getAccessToken();

		if (!accessToken) {
			return null;
		}

		try {
			return await call(accessToken);
		} catch (error) {
			if (!(error instanceof UnauthorizedApiError)) {
				throw error;
			}
		}

		// The token looked valid but was refused — a clock that drifted, or a server
		// restarted with a new signing key. Worth one renewal and one retry; a second
		// refusal means the session really is over.
		const renewed = await this.tokens.refreshAccessToken();

		if (!renewed) {
			return null;
		}

		try {
			return await call(renewed);
		} catch (error) {
			if (error instanceof UnauthorizedApiError) {
				return null;
			}

			throw error;
		}
	}
}
