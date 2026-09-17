import { object, string } from "zod";
import {
	AuthApiError,
	type IAuthApiClient,
	type IssuedToken,
} from "@/background/features/auth/models/authApiClient";
import type {
	LoginCredentials,
	RegisterCredentials,
} from "@/common/features/auth/validators/authValidators";

const issuedTokenValidator = object({
	accessToken: string().min(1),
	expiresAt: string(),
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

	private async postForToken(
		path: string,
		body: LoginCredentials | RegisterCredentials,
		messagesByStatus: Record<number, string>,
	): Promise<IssuedToken> {
		if (!this.baseUrl) {
			throw new AuthApiError(
				"The API address is not configured (VITE_API_BASE_URL).",
			);
		}

		let response: Response;

		try {
			response = await fetch(`${this.baseUrl}${path}`, {
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

		if (response.status === 400) {
			throw new AuthApiError(await readFirstValidationError(response));
		}

		throw new AuthApiError(
			`Unexpected response from the server (${response.status}).`,
		);
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
