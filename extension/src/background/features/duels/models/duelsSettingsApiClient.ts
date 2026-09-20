import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";

/**
 * Talks to the API's /settings endpoints on behalf of a signed-in user.
 * Failures are thrown as ApiError (or UnauthorizedApiError when the token is
 * rejected) with a message fit to show the user as-is.
 */
export interface IDuelsSettingsApiClient {
	/** The user's saved settings, or null when they have none yet. */
	get(accessToken: string): Promise<DuelsSettings | null>;
	save(accessToken: string, settings: DuelsSettings): Promise<DuelsSettings>;
}
