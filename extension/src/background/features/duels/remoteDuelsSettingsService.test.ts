import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IAuthSessionStore } from "@/background/features/auth/models/authSessionStore";
import type { IDuelsSettingsApiClient } from "@/background/features/duels/models/duelsSettingsApiClient";
import { ApiError, UnauthorizedApiError } from "@/background/models/apiError";
import type { AuthSession } from "@/common/features/auth/validators/authValidators";
import { RemoteDuelsSettingsService } from "./remoteDuelsSettingsService";

const settings = {
	levelMin: 10,
	levelMax: 40,
	lootFilterEnabled: true,
	lootMax: 3_000_000,
	skipAllOrders: false,
	skipSpecificOrders: false,
	ordersToSkip: [],
	cooldownMs: 120_000,
	rankingOffset: 1900,
};

const session: AuthSession = {
	accessToken: "token",
	expiresAt: "2026-09-27T10:00:00Z",
	email: "knight@example.com",
};

describe("RemoteDuelsSettingsService", () => {
	let api: { get: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
	let sessions: IAuthSessionStore & { current: AuthSession | null };
	let service: RemoteDuelsSettingsService;

	beforeEach(() => {
		api = { get: vi.fn(), save: vi.fn() };
		sessions = {
			current: session,
			get: vi.fn(async () => sessions.current),
			save: vi.fn(async () => {}),
			clear: vi.fn(async () => {
				sessions.current = null;
			}),
		};
		service = new RemoteDuelsSettingsService(
			api as unknown as IDuelsSettingsApiClient,
			sessions,
		);
	});

	it("load връща null и не вика API-то, когато никой не е влязъл", async () => {
		sessions.current = null;

		expect(await service.load()).toBeNull();
		expect(api.get).not.toHaveBeenCalled();
	});

	it("save връща null и не вика API-то, когато никой не е влязъл", async () => {
		sessions.current = null;

		expect(await service.save(settings)).toBeNull();
		expect(api.save).not.toHaveBeenCalled();
	});

	it("load подава токена от сесията", async () => {
		api.get.mockResolvedValue(settings);

		expect(await service.load()).toEqual(settings);
		expect(api.get).toHaveBeenCalledWith("token");
	});

	it("save подава токена и настройките", async () => {
		api.save.mockResolvedValue(settings);

		expect(await service.save(settings)).toEqual(settings);
		expect(api.save).toHaveBeenCalledWith("token", settings);
	});

	it("изчиства сесията и връща null при отхвърлен токен", async () => {
		api.get.mockRejectedValue(new UnauthorizedApiError());

		expect(await service.load()).toBeNull();
		expect(sessions.clear).toHaveBeenCalledOnce();
	});

	it("пропуска другите грешки нагоре, без да изчиства сесията", async () => {
		api.save.mockRejectedValue(new ApiError("Could not reach the server."));

		await expect(service.save(settings)).rejects.toThrow(
			"Could not reach the server.",
		);
		expect(sessions.clear).not.toHaveBeenCalled();
	});
});
