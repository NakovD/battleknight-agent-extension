import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSession } from "@/common/features/auth/validators/authValidators";
import { AuthService } from "./authService";
import { AuthApiError, type IAuthApiClient } from "./models/authApiClient";
import type { IAuthSessionStore } from "./models/authSessionStore";

const now = new Date("2026-09-17T12:00:00Z");
const issuedToken = { accessToken: "token", expiresAt: "2026-09-24T12:00:00Z" };

class InMemorySessionStore implements IAuthSessionStore {
	session: AuthSession | null = null;

	get = vi.fn(async () => this.session);
	save = vi.fn(async (session: AuthSession) => {
		this.session = session;
	});
	clear = vi.fn(async () => {
		this.session = null;
	});
}

describe("AuthService", () => {
	let api: { register: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn> };
	let sessions: InMemorySessionStore;
	let service: AuthService;

	beforeEach(() => {
		api = { register: vi.fn(), login: vi.fn() };
		sessions = new InMemorySessionStore();
		service = new AuthService(api as unknown as IAuthApiClient, sessions, () => now);
	});

	it("login записва сесия и връща влязъл акаунт с нормализиран email", async () => {
		api.login.mockResolvedValue(issuedToken);

		const account = await service.login({
			email: "  Knight@Example.COM ",
			password: "super-secret-passphrase",
		});

		expect(account).toEqual({
			status: "signedIn",
			email: "knight@example.com",
			expiresAt: issuedToken.expiresAt,
		});
		expect(sessions.session).toEqual({
			accessToken: "token",
			expiresAt: issuedToken.expiresAt,
			email: "knight@example.com",
		});
	});

	it("register записва сесия по същия начин", async () => {
		api.register.mockResolvedValue(issuedToken);

		const account = await service.register({
			email: "knight@example.com",
			password: "super-secret-passphrase",
		});

		expect(account.status).toBe("signedIn");
		expect(sessions.save).toHaveBeenCalledOnce();
	});

	it("неуспешен login не записва сесия и пропуска грешката нагоре", async () => {
		api.login.mockRejectedValue(new AuthApiError("Invalid email or password."));

		await expect(
			service.login({ email: "knight@example.com", password: "wrong" }),
		).rejects.toThrow("Invalid email or password.");
		expect(sessions.save).not.toHaveBeenCalled();
	});

	it("logout изчиства сесията", async () => {
		sessions.session = { ...issuedToken, email: "knight@example.com" };

		const account = await service.logout();

		expect(account).toEqual({ status: "signedOut" });
		expect(sessions.session).toBeNull();
	});

	it("getAccount връща signedOut без сесия", async () => {
		expect(await service.getAccount()).toEqual({ status: "signedOut" });
	});

	it("getAccount връща влязъл акаунт при валидна сесия", async () => {
		sessions.session = { ...issuedToken, email: "knight@example.com" };

		expect(await service.getAccount()).toEqual({
			status: "signedIn",
			email: "knight@example.com",
			expiresAt: issuedToken.expiresAt,
		});
	});

	it("getAccount изчиства изтекла сесия и връща signedOut", async () => {
		sessions.session = {
			accessToken: "token",
			expiresAt: "2026-09-17T11:59:59Z",
			email: "knight@example.com",
		};

		expect(await service.getAccount()).toEqual({ status: "signedOut" });
		expect(sessions.session).toBeNull();
	});
});
