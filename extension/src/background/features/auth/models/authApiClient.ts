import { ApiError } from "@/background/models/apiError";
import type {
	LoginCredentials,
	RegisterCredentials,
} from "@/common/features/auth/validators/authValidators";

export interface IssuedToken {
	accessToken: string;
	expiresAt: string;
	refreshToken: string;
	refreshTokenExpiresAt: string;
}

/**
 * Talks to the API's /auth endpoints. Failures are thrown as AuthApiError with a
 * message fit to show the user as-is.
 */
export interface IAuthApiClient {
	register(credentials: RegisterCredentials): Promise<IssuedToken>;
	login(credentials: LoginCredentials): Promise<IssuedToken>;

	/**
	 * Exchanges a refresh token for a fresh pair. The server rotates the refresh
	 * token on every call, so the returned one replaces the one passed in.
	 *
	 * Throws UnauthorizedApiError when the token is rejected — that means the
	 * session is over, unlike a network failure, which is worth retrying.
	 */
	refresh(refreshToken: string): Promise<IssuedToken>;

	/** Revokes the refresh token server-side. */
	logout(refreshToken: string): Promise<void>;
}

export class AuthApiError extends ApiError {
	override name = "AuthApiError";
}
