import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedApiError } from "@/background/models/apiError";
import { FetchDuelsSettingsApiClient } from "./fetchDuelsSettingsApiClient";

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

const jsonResponse = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

describe("FetchDuelsSettingsApiClient", () => {
	const fetchMock = vi.fn<typeof fetch>();
	const client = new FetchDuelsSettingsApiClient("http://localhost:5224");

	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("get праща токена и връща настройките", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, { ...settings, updatedAt: "2026-09-20T10:00:00Z" }),
		);

		const result = await client.get("token");

		expect(result).toEqual(settings);
		expect(fetchMock).toHaveBeenCalledWith("http://localhost:5224/settings", {
			method: "GET",
			headers: { Authorization: "Bearer token" },
			body: undefined,
		});
	});

	it("get връща null при 404 (още няма записани настройки)", async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

		expect(await client.get("token")).toBeNull();
	});

	it("save праща PUT с настройките в тялото", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, settings));

		await client.save("token", settings);

		expect(fetchMock).toHaveBeenCalledWith("http://localhost:5224/settings", {
			method: "PUT",
			headers: {
				Authorization: "Bearer token",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(settings),
		});
	});

	it("хвърля UnauthorizedApiError при 401", async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

		await expect(client.get("expired-token")).rejects.toBeInstanceOf(
			UnauthorizedApiError,
		);
	});

	it("показва първата валидационна грешка при 400", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(400, {
				errors: { LevelMin: ["levelMin must not be greater than levelMax."] },
			}),
		);

		await expect(client.save("token", settings)).rejects.toThrow(
			"levelMin must not be greater than levelMax.",
		);
	});

	it("превежда мрежова грешка в съобщение за недостъпен сървър", async () => {
		fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(client.get("token")).rejects.toThrow(
			"Could not reach the server. Please try again later.",
		);
	});

	it("отхвърля успешен отговор с неочаквана форма", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, { levelMin: "ten" }));

		await expect(client.get("token")).rejects.toThrow(
			"Unexpected response from the server.",
		);
	});

	it("включва статуса при непознат неуспешен отговор", async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

		await expect(client.get("token")).rejects.toThrow(
			"Unexpected response from the server (500).",
		);
	});

	it("не прави заявка, ако адресът на API-то не е конфигуриран", async () => {
		await expect(
			new FetchDuelsSettingsApiClient(undefined).get("token"),
		).rejects.toThrow("The API address is not configured (VITE_API_BASE_URL).");
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
