import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, UnauthorizedApiError } from "@/background/models/apiError";
import type { AuthSession } from "@/common/features/auth/validators/authValidators";
import { AuthService } from "./authService";
import { AuthApiError, type IAuthApiClient } from "./models/authApiClient";
import type { IAuthSessionStore } from "./models/authSessionStore";

const now = new Date("2026-09-17T12:00:00Z");

const issuedToken = {
	accessToken: "token",
	expiresAt: "2026-09-17T12:15:00Z",
	refreshToken: "refresh-token",
	refreshTokenExpiresAt: "2026-10-17T12:00:00Z",
};

const storedSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
	...issuedToken,
	email: "knight@example.com",
	...overrides,
});

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
	let api: {
		register: ReturnType<typeof vi.fn>;
		login: ReturnType<typeof vi.fn>;
		refresh: ReturnType<typeof vi.fn>;
		logout: ReturnType<typeof vi.fn>;
	};
	let sessions: InMemorySessionStore;
	let service: AuthService;

	beforeEach(() => {
		api = {
			register: vi.fn(),
			login: vi.fn(),
			refresh: vi.fn(),
			logout: vi.fn(async () => {}),
		};
		sessions = new InMemorySessionStore();
		service = new AuthService(
			api as unknown as IAuthApiClient,
			sessions,
			() => now,
		);
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
			// Акаунтът живее, докато живее сесията, не докато живее access токенът.
			expiresAt: issuedToken.refreshTokenExpiresAt,
		});
		expect(sessions.session).toEqual(storedSession());
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

	it("logout изчиства сесията и отменя токена на сървъра", async () => {
		sessions.session = storedSession();

		const account = await service.logout();

		expect(account).toEqual({ status: "signedOut" });
		expect(sessions.session).toBeNull();
		expect(api.logout).toHaveBeenCalledWith("refresh-token");
	});

	it("logout изчиства сесията дори когато сървърът е недостъпен", async () => {
		sessions.session = storedSession();
		api.logout.mockRejectedValue(
			new AuthApiError("Could not reach the server."),
		);

		expect(await service.logout()).toEqual({ status: "signedOut" });
		expect(sessions.session).toBeNull();
	});

	it("logout без сесия не вика сървъра", async () => {
		await service.logout();

		expect(api.logout).not.toHaveBeenCalled();
	});

	it("getAccount връща signedOut без сесия", async () => {
		expect(await service.getAccount()).toEqual({ status: "signedOut" });
	});

	it("getAccount връща влязъл акаунт при валидна сесия", async () => {
		sessions.session = storedSession();

		expect(await service.getAccount()).toEqual({
			status: "signedIn",
			email: "knight@example.com",
			expiresAt: issuedToken.refreshTokenExpiresAt,
		});
	});

	it("getAccount не подновява и не излиза заради изтекъл access токен", async () => {
		// Отварянето на попъпа не е повод за заявка към сървъра — access токенът
		// се подновява тогава, когато наистина трябва да се използва.
		sessions.session = storedSession({ expiresAt: "2026-09-17T11:59:59Z" });

		expect((await service.getAccount()).status).toBe("signedIn");
		expect(api.refresh).not.toHaveBeenCalled();
		expect(sessions.clear).not.toHaveBeenCalled();
	});

	it("getAccount изчиства сесия с изтекъл refresh токен и връща signedOut", async () => {
		sessions.session = storedSession({
			refreshTokenExpiresAt: "2026-09-17T11:59:59Z",
		});

		expect(await service.getAccount()).toEqual({ status: "signedOut" });
		expect(sessions.session).toBeNull();
	});

	it("getAccessToken връща null без сесия", async () => {
		expect(await service.getAccessToken()).toBeNull();
		expect(api.refresh).not.toHaveBeenCalled();
	});

	it("getAccessToken връща записания токен, докато е още валиден", async () => {
		sessions.session = storedSession();

		expect(await service.getAccessToken()).toBe("token");
		expect(api.refresh).not.toHaveBeenCalled();
	});

	it("getAccessToken подновява токен, който изтича в следващите секунди", async () => {
		// 20 секунди живот: достатъчно малко, че заявката да пристигне след смъртта му.
		sessions.session = storedSession({ expiresAt: "2026-09-17T12:00:20Z" });
		api.refresh.mockResolvedValue({
			...issuedToken,
			accessToken: "fresh-token",
		});

		expect(await service.getAccessToken()).toBe("fresh-token");
		expect(api.refresh).toHaveBeenCalledWith("refresh-token");
	});

	it("подновяването записва ротирания refresh токен и запазва email-а", async () => {
		sessions.session = storedSession({ expiresAt: "2026-09-17T11:00:00Z" });
		api.refresh.mockResolvedValue({
			...issuedToken,
			accessToken: "fresh-token",
			refreshToken: "rotated-token",
		});

		await service.getAccessToken();

		expect(sessions.session).toEqual(
			storedSession({
				accessToken: "fresh-token",
				refreshToken: "rotated-token",
			}),
		);
	});

	it("отхвърлен refresh токен изчиства сесията и връща null", async () => {
		sessions.session = storedSession({ expiresAt: "2026-09-17T11:00:00Z" });
		api.refresh.mockRejectedValue(new UnauthorizedApiError());

		expect(await service.getAccessToken()).toBeNull();
		expect(sessions.session).toBeNull();
	});

	it("мрежова грешка при подновяване запазва сесията и изгърмява", async () => {
		// Недостъпният сървър не казва нищо за токена, затова сесията остава.
		sessions.session = storedSession({ expiresAt: "2026-09-17T11:00:00Z" });
		api.refresh.mockRejectedValue(new ApiError("Could not reach the server."));

		await expect(service.getAccessToken()).rejects.toThrow(
			"Could not reach the server.",
		);
		expect(sessions.session).not.toBeNull();
	});

	it("две паралелни подновявания правят само една заявка", async () => {
		// API-то ротира refresh токена при всяко подновяване и приема второто
		// използване на стария за изтичане на информация — отменя цялата верига.
		// Затова паралелните повиквания трябва да споделят една заявка.
		sessions.session = storedSession({ expiresAt: "2026-09-17T11:00:00Z" });
		api.refresh.mockResolvedValue({
			...issuedToken,
			accessToken: "fresh-token",
		});

		const tokens = await Promise.all([
			service.getAccessToken(),
			service.refreshAccessToken(),
		]);

		expect(tokens).toEqual(["fresh-token", "fresh-token"]);
		expect(api.refresh).toHaveBeenCalledOnce();
	});

	it("следващо подновяване тръгва наново, след като предишното е приключило", async () => {
		sessions.session = storedSession({ expiresAt: "2026-09-17T11:00:00Z" });
		api.refresh
			.mockResolvedValueOnce({ ...issuedToken, refreshToken: "rotated-once" })
			.mockResolvedValueOnce({ ...issuedToken, accessToken: "second-token" });

		await service.refreshAccessToken();

		expect(await service.refreshAccessToken()).toBe("second-token");
		expect(api.refresh).toHaveBeenNthCalledWith(2, "rotated-once");
	});

	it("refreshAccessToken връща null без сесия", async () => {
		expect(await service.refreshAccessToken()).toBeNull();
		expect(api.refresh).not.toHaveBeenCalled();
	});
});
