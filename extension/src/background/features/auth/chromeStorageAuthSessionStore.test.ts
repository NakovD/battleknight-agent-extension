import { beforeEach, describe, expect, it } from "vitest";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";
import {
	AUTH_SESSION_STORAGE_KEY,
	ChromeStorageAuthSessionStore,
} from "./chromeStorageAuthSessionStore";

const session = {
	accessToken: "token",
	expiresAt: "2026-09-24T10:00:00Z",
	refreshToken: "refresh-token",
	refreshTokenExpiresAt: "2026-10-24T10:00:00Z",
	email: "knight@example.com",
};

describe("ChromeStorageAuthSessionStore", () => {
	let chromeStorage: ReturnType<typeof installChromeStorageMock>;
	let store: ChromeStorageAuthSessionStore;

	beforeEach(() => {
		chromeStorage = installChromeStorageMock();
		store = new ChromeStorageAuthSessionStore();
	});

	it("връща null, когато няма записана сесия", async () => {
		expect(await store.get()).toBeNull();
	});

	it("записва и после връща сесията", async () => {
		await store.save(session);

		expect(chromeStorage.store[AUTH_SESSION_STORAGE_KEY]).toEqual(session);
		expect(await store.get()).toEqual(session);
	});

	it("clear премахва сесията", async () => {
		await store.save(session);

		await store.clear();

		expect(AUTH_SESSION_STORAGE_KEY in chromeStorage.store).toBe(false);
		expect(await store.get()).toBeNull();
	});

	it("третира повредена стойност като липсваща сесия", async () => {
		chromeStorage.store[AUTH_SESSION_STORAGE_KEY] = { accessToken: "" };

		expect(await store.get()).toBeNull();
	});

	it("третира сесия без refresh токен като липсваща", async () => {
		// Записана преди refresh токените; няма как да се поднови, затова се
		// изисква повторно влизане.
		const { refreshToken, refreshTokenExpiresAt, ...legacy } = session;
		chromeStorage.store[AUTH_SESSION_STORAGE_KEY] = legacy;

		expect(await store.get()).toBeNull();
	});
});
