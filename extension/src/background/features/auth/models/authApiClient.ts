import { ApiError } from "@/background/models/apiError";
import type {
	LoginCredentials,
	RegisterCredentials,
} from "@/common/features/auth/validators/authValidators";

export interface IssuedToken {
	accessToken: string;
	expiresAt: string;
}

/**
 * Talks to the API's /auth endpoints. Failures are thrown as AuthApiError with a
 * message fit to show the user as-is.
 */
export interface IAuthApiClient {
	register(credentials: RegisterCredentials): Promise<IssuedToken>;
	login(credentials: LoginCredentials): Promise<IssuedToken>;
}

export class AuthApiError extends ApiError {
	override name = "AuthApiError";
}
