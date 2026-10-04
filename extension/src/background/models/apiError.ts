/** An API failure whose message is safe to show the user as-is. */
export class ApiError extends Error {
	override name = "ApiError";
}

/** The stored token was rejected, so the session should be dropped. */
export class UnauthorizedApiError extends ApiError {
	override name = "UnauthorizedApiError";

	constructor(message = "Your session has expired. Please sign in again.") {
		super(message);
	}
}
