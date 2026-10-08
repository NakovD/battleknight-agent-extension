/**
 * Hands out an access token for the signed-in user, renewing it when needed.
 *
 * Kept separate from the session store so features that call the API don't need
 * to know how tokens are stored or renewed — they only need a usable one.
 */
export interface IAccessTokenProvider {
	/** A usable access token, or null when nobody is signed in. */
	getAccessToken(): Promise<string | null>;

	/**
	 * Renews the access token after the API rejected one that looked valid.
	 * Null when the session turned out to be over.
	 */
	refreshAccessToken(): Promise<string | null>;
}
