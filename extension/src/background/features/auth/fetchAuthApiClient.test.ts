import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FetchAuthApiClient } from "./fetchAuthApiClient";
import { AuthApiError } from "./models/authApiClient";

const credentials = { email: "knight@example.com", password: "super-secret-passphrase" };

const jsonResponse = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

describe("FetchAuthApiClient", () => {
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("login праща POST с JSON тяло към /auth/login и връща токена", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, { accessToken: "token", expiresAt: "2026-09-24T10:00:00Z" }),
		);
		const client = new FetchAuthApiClient("http://localhost:5224");

		const token = await client.login(credentials);

		expect(token).toEqual({ accessToken: "token", expiresAt: "2026-09-24T10:00:00Z" });
		expect(fetchMock).toHaveBeenCalledWith("http://localhost:5224/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(credentials),
		});
	});

	it("register вика /auth/register", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, { accessToken: "token", expiresAt: "2026-09-24T10:00:00Z" }),
		);

		await new FetchAuthApiClient("http://localhost:5224").register(credentials);

		expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:5224/auth/register");
	});

	it("маха наклонената черта в края на адреса", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, { accessToken: "token", expiresAt: "2026-09-24T10:00:00Z" }),
		);

		await new FetchAuthApiClient("http://localhost:5224/").login(credentials);

		expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:5224/auth/login");
	});

	it("превежда 401 при login в съобщение за грешни данни", async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

		await expect(
			new FetchAuthApiClient("http://api").login(credentials),
		).rejects.toThrow(new AuthApiError("Invalid email or password."));
	});

	it("превежда 409 при register в съобщение за зает email", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(409, "A user with this email already exists."),
		);

		await expect(
			new FetchAuthApiClient("http://api").register(credentials),
		).rejects.toThrow("An account with this email already exists.");
	});

	it("показва първата валидационна грешка от 400", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(400, {
				title: "One or more validation errors occurred.",
				errors: {
					Password: [
						"The field Password must be a string or array type with a minimum length of '8'.",
					],
				},
			}),
		);

		await expect(
			new FetchAuthApiClient("http://api").register(credentials),
		).rejects.toThrow(
			"The field Password must be a string or array type with a minimum length of '8'.",
		);
	});

	it("пада на общо съобщение при 400 без разпознаваемо тяло", async () => {
		fetchMock.mockResolvedValue(new Response("nope", { status: 400 }));

		await expect(
			new FetchAuthApiClient("http://api").register(credentials),
		).rejects.toThrow("The submitted details are invalid.");
	});

	it("превежда мрежова грешка в съобщение за недостъпен сървър", async () => {
		fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(
			new FetchAuthApiClient("http://api").login(credentials),
		).rejects.toThrow("Could not reach the server. Please try again later.");
	});

	it("отхвърля успешен отговор с неочаквана форма", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, { token: "wrong-shape" }));

		await expect(
			new FetchAuthApiClient("http://api").login(credentials),
		).rejects.toThrow("Unexpected response from the server.");
	});

	it("включва статуса при непознат неуспешен отговор", async () => {
		fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

		await expect(
			new FetchAuthApiClient("http://api").login(credentials),
		).rejects.toThrow("Unexpected response from the server (500).");
	});

	it("не прави заявка, ако адресът на API-то не е конфигуриран", async () => {
		await expect(new FetchAuthApiClient(undefined).login(credentials)).rejects.toThrow(
			"The API address is not configured (VITE_API_BASE_URL).",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
