import { object, string } from "zod";
import type { IDuelsSettingsApiClient } from "@/background/features/duels/models/duelsSettingsApiClient";
import { ApiError, UnauthorizedApiError } from "@/background/models/apiError";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import { duelsSettingsValidator } from "@/common/features/duels/validators/duelsSettingsValidator";

/** ASP.NET Core's ValidationProblemDetails — only the part we read. */
const validationProblemValidator = object({
	errors: object({}).catchall(string().array()),
});

// The API returns the saved settings plus an updatedAt stamp the extension has no
// use for; the validator drops unknown keys.
const settingsResponseValidator = duelsSettingsValidator;

export class FetchDuelsSettingsApiClient implements IDuelsSettingsApiClient {
	private readonly baseUrl: string | undefined;

	constructor(baseUrl: string | undefined) {
		this.baseUrl = baseUrl?.replace(/\/+$/, "");
	}

	async get(accessToken: string): Promise<DuelsSettings | null> {
		const response = await this.request("GET", accessToken);

		// No settings saved for this account yet.
		if (response.status === 404) {
			return null;
		}

		return this.readSettings(response);
	}

	async save(
		accessToken: string,
		settings: DuelsSettings,
	): Promise<DuelsSettings> {
		return this.readSettings(await this.request("PUT", accessToken, settings));
	}

	private async request(
		method: "GET" | "PUT",
		accessToken: string,
		body?: DuelsSettings,
	): Promise<Response> {
		if (!this.baseUrl) {
			throw new ApiError("The API address is not configured (VITE_API_BASE_URL).");
		}

		try {
			return await fetch(`${this.baseUrl}/settings`, {
				method,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					...(body ? { "Content-Type": "application/json" } : {}),
				},
				body: body ? JSON.stringify(body) : undefined,
			});
		} catch {
			// fetch only rejects for network-level failures (server down, CORS, DNS).
			throw new ApiError("Could not reach the server. Please try again later.");
		}
	}

	private async readSettings(response: Response): Promise<DuelsSettings> {
		if (response.status === 401) {
			throw new UnauthorizedApiError();
		}

		if (response.ok) {
			const settings = settingsResponseValidator.safeParse(
				await response.json().catch(() => undefined),
			);

			if (!settings.success) {
				throw new ApiError("Unexpected response from the server.");
			}

			return settings.data;
		}

		if (response.status === 400) {
			throw new ApiError(await readFirstValidationError(response));
		}

		throw new ApiError(
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

	return firstError ?? "The settings were rejected by the server.";
};
