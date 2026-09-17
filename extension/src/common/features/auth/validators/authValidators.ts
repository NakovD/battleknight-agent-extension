import {
	discriminatedUnion,
	email,
	literal,
	object,
	string,
	type infer as ZodInfer,
} from "zod";

// Mirrors the API's RegisterRequest/LoginRequest DataAnnotations, so the popup can
// reject what the server would reject without a round trip.
const emailField = string()
	.trim()
	.max(256, "Email must be at most 256 characters")
	.pipe(email("Enter a valid email address"));

export const loginCredentialsValidator = object({
	email: emailField,
	password: string()
		.min(1, "Enter your password")
		.max(128, "Password must be at most 128 characters"),
});

export const registerCredentialsValidator = object({
	email: emailField,
	password: string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password must be at most 128 characters"),
});

export const accountValidator = discriminatedUnion("status", [
	object({ status: literal("signedOut") }),
	object({
		status: literal("signedIn"),
		email: string(),
		expiresAt: string(),
	}),
]);

/** What the background keeps in chrome.storage for a signed-in user. */
export const authSessionValidator = object({
	accessToken: string().min(1),
	expiresAt: string(),
	email: string(),
});

export const authMessageValidator = discriminatedUnion("type", [
	object({ type: literal("AUTH_REGISTER"), payload: registerCredentialsValidator }),
	object({ type: literal("AUTH_LOGIN"), payload: loginCredentialsValidator }),
	object({ type: literal("AUTH_LOGOUT") }),
	object({ type: literal("AUTH_GET_ACCOUNT") }),
]);

export const authMessageResponseValidator = discriminatedUnion("ok", [
	object({ ok: literal(true), account: accountValidator }),
	object({ ok: literal(false), error: string() }),
]);

export type LoginCredentials = ZodInfer<typeof loginCredentialsValidator>;
export type RegisterCredentials = ZodInfer<typeof registerCredentialsValidator>;
export type Account = ZodInfer<typeof accountValidator>;
export type AuthSession = ZodInfer<typeof authSessionValidator>;
export type AuthMessage = ZodInfer<typeof authMessageValidator>;
export type AuthMessageResponse = ZodInfer<typeof authMessageResponseValidator>;
