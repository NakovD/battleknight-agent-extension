import { object, string } from "zod";
import {
	AuthApiError,
	type IAuthApiClient,
	type IssuedToken,
} from "@/background/features/auth/models/authApiClient";
import { UnauthorizedApiError } from "@/background/models/apiError";
import type {
	LoginCredentials,
	RegisterCredentials,
} from "@/common/features/auth/validators/authValidators";

const issuedTokenValidator = object({
	accessToken: string().min(1),
	expiresAt: string(),
	refreshToken: string().min(1),
	refreshTokenExpiresAt: string(),
});

/** ASP.NET Core's ValidationProblemDetails — only the part we read. */
const validationProblemValidator = object({
	errors: object({}).catchall(string().array()),
});

export class FetchAuthApiClient implements IAuthApiClient {
	private readonly baseUrl: string | undefined;

	constructor(baseUrl: string | undefined) {
		this.baseUrl = baseUrl?.replace(/\/+$/, "");
	}

	register(credentials: RegisterCredentials): Promise<IssuedToken> {
		return this.postForToken("/auth/register", credentials, {
			409: "An account with this email already exists.",
		});
	}

	login(credentials: LoginCredentials): Promise<IssuedToken> {
		return this.postForToken("/auth/login", credentials, {
			401: "Invalid email or password.",
		});
	}

	refresh(refreshToken: string): Promise<IssuedToken> {
		return this.postForToken("/auth/refresh", { refreshToken });
	}

	async logout(refreshToken: string): Promise<void> {
		// The endpoint answers 204 whether or not the token existed, so there is
		// nothing to read and nothing to report.
		await this.post("/auth/logout", { refreshToken });
	}

	private async postForToken(
		path: string,
		body: object,
		messagesByStatus: Record<number, string> = {},
	): Promise<IssuedToken> {
		const response = await this.post(path, body);

		if (response.ok) {
			const token = issuedTokenValidator.safeParse(
				await response.json().catch(() => undefined),
			);

			if (!token.success) {
				throw new AuthApiError("Unexpected response from the server.");
			}

			return token.data;
		}

		const knownMessage = messagesByStatus[response.status];

		if (knownMessage) {
			throw new AuthApiError(knownMessage);
		}

		// A rejected refresh token is not an error to show and retry — the session
		// is over, so the caller signs the user out.
		if (response.status === 401) {
			throw new UnauthorizedApiError();
		}

		if (response.status === 400) {
			throw new AuthApiError(await readFirstValidationError(response));
		}

		throw new AuthApiError(
			`Unexpected response from the server (${response.status}).`,
		);
	}

	private async post(path: string, body: object): Promise<Response> {
		if (!this.baseUrl) {
			throw new AuthApiError(
				"The API address is not configured (VITE_API_BASE_URL).",
			);
		}

		try {
			return await fetch(`${this.baseUrl}${path}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
		} catch {
			// fetch only rejects for network-level failures (server down, CORS, DNS).
			throw new AuthApiError(
				"Could not reach the server. Please try again later.",
			);
		}
	}
}

const readFirstValidationError = async (response: Response) => {
	const problem = validationProblemValidator.safeParse(
		await response.json().catch(() => undefined),
	);

	const firstError = problem.success
		? Object.values(problem.data.errors).flat()[0]
		: undefined;

	return firstError ?? "The submitted details are invalid.";
};
