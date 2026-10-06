import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IAccessTokenProvider } from "@/background/features/auth/models/accessTokenProvider";
import type { IDuelsSettingsApiClient } from "@/background/features/duels/models/duelsSettingsApiClient";
import { ApiError, UnauthorizedApiError } from "@/background/models/apiError";
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

describe("RemoteDuelsSettingsService", () => {
	let api: { get: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
	let tokens: IAccessTokenProvider & { current: string | null };
	let service: RemoteDuelsSettingsService;

	beforeEach(() => {
		api = { get: vi.fn(), save: vi.fn() };
		tokens = {
			current: "token",
			getAccessToken: vi.fn(async () => tokens.current),
			refreshAccessToken: vi.fn(async () => "renewed-token"),
		};
		service = new RemoteDuelsSettingsService(
			api as unknown as IDuelsSettingsApiClient,
			tokens,
		);
	});

	it("load връща null и не вика API-то, когато никой не е влязъл", async () => {
		tokens.current = null;

		expect(await service.load()).toBeNull();
		expect(api.get).not.toHaveBeenCalled();
	});

	it("save връща null и не вика API-то, когато никой не е влязъл", async () => {
		tokens.current = null;

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

	it("подновява токена и опитва пак при отхвърлен токен", async () => {
		api.get
			.mockRejectedValueOnce(new UnauthorizedApiError())
			.mockResolvedValueOnce(settings);

		expect(await service.load()).toEqual(settings);
		expect(api.get).toHaveBeenNthCalledWith(2, "renewed-token");
	});

	it("повтаря и записването с подновения токен", async () => {
		api.save
			.mockRejectedValueOnce(new UnauthorizedApiError())
			.mockResolvedValueOnce(settings);

		expect(await service.save(settings)).toEqual(settings);
		expect(api.save).toHaveBeenNthCalledWith(2, "renewed-token", settings);
	});

	it("връща null, когато сесията не може да се поднови", async () => {
		api.get.mockRejectedValue(new UnauthorizedApiError());
		tokens.refreshAccessToken = vi.fn(async () => null);

		expect(await service.load()).toBeNull();
		expect(api.get).toHaveBeenCalledOnce();
	});

	it("не опитва трети път, ако и подновеният токен е отхвърлен", async () => {
		api.get.mockRejectedValue(new UnauthorizedApiError());

		expect(await service.load()).toBeNull();
		expect(api.get).toHaveBeenCalledTimes(2);
	});

	it("пропуска другите грешки нагоре, без да подновява токена", async () => {
		api.save.mockRejectedValue(new ApiError("Could not reach the server."));

		await expect(service.save(settings)).rejects.toThrow(
			"Could not reach the server.",
		);
		expect(tokens.refreshAccessToken).not.toHaveBeenCalled();
	});

	it("пропуска грешка от повторния опит нагоре", async () => {
		api.get
			.mockRejectedValueOnce(new UnauthorizedApiError())
			.mockRejectedValueOnce(new ApiError("Could not reach the server."));

		await expect(service.load()).rejects.toThrow("Could not reach the server.");
	});
});
