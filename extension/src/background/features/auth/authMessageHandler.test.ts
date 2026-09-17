import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthMessageHandler } from "./authMessageHandler";
import { AuthApiError } from "./models/authApiClient";

const signedIn = {
	status: "signedIn" as const,
	email: "knight@example.com",
	expiresAt: "2026-09-24T12:00:00Z",
};

describe("createAuthMessageHandler", () => {
	const auth = {
		register: vi.fn(),
		login: vi.fn(),
		logout: vi.fn(),
		getAccount: vi.fn(),
	};
	const handle = createAuthMessageHandler(auth);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("връща null за съобщения, които не са auth", () => {
		expect(handle({ type: "GET_STATUS" })).toBeNull();
		expect(handle("not even an object")).toBeNull();
		expect(handle(null)).toBeNull();
	});

	it("AUTH_LOGIN вика login и връща акаунта", async () => {
		auth.login.mockResolvedValue(signedIn);
		const payload = { email: "knight@example.com", password: "super-secret-passphrase" };

		const reply = await handle({ type: "AUTH_LOGIN", payload });

		expect(auth.login).toHaveBeenCalledWith(payload);
		expect(reply).toEqual({ ok: true, account: signedIn });
	});

	it("AUTH_REGISTER вика register", async () => {
		auth.register.mockResolvedValue(signedIn);

		await handle({
			type: "AUTH_REGISTER",
			payload: { email: "knight@example.com", password: "super-secret-passphrase" },
		});

		expect(auth.register).toHaveBeenCalledOnce();
	});

	it("AUTH_LOGOUT и AUTH_GET_ACCOUNT връщат акаунта от услугата", async () => {
		auth.logout.mockResolvedValue({ status: "signedOut" });
		auth.getAccount.mockResolvedValue(signedIn);

		expect(await handle({ type: "AUTH_LOGOUT" })).toEqual({
			ok: true,
			account: { status: "signedOut" },
		});
		expect(await handle({ type: "AUTH_GET_ACCOUNT" })).toEqual({
			ok: true,
			account: signedIn,
		});
	});

	it("предава съобщението на AuthApiError към popup-а", async () => {
		auth.login.mockRejectedValue(new AuthApiError("Invalid email or password."));

		const reply = await handle({
			type: "AUTH_LOGIN",
			payload: { email: "knight@example.com", password: "wrong-password" },
		});

		expect(reply).toEqual({ ok: false, error: "Invalid email or password." });
	});

	it("скрива детайлите на неочаквани грешки", async () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
		auth.login.mockRejectedValue(new Error("internal detail"));

		const reply = await handle({
			type: "AUTH_LOGIN",
			payload: { email: "knight@example.com", password: "super-secret-passphrase" },
		});

		expect(reply).toEqual({
			ok: false,
			error: "Something went wrong. Please try again.",
		});
		consoleError.mockRestore();
	});

	it("отговаря с грешка на auth съобщение с невалиден payload, без да вика услугата", async () => {
		const reply = await handle({
			type: "AUTH_REGISTER",
			payload: { email: "not-an-email", password: "short" },
		});

		expect(reply).toEqual({ ok: false, error: "Invalid request." });
		expect(auth.register).not.toHaveBeenCalled();
	});
});
