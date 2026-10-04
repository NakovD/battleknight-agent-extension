import { describe, expect, it } from "vitest";
import {
	authMessageValidator,
	loginCredentialsValidator,
	registerCredentialsValidator,
} from "./authValidators";

describe("authValidators", () => {
	it("изрязва интервалите около email-а", () => {
		const result = loginCredentialsValidator.parse({
			email: "  knight@example.com  ",
			password: "x",
		});

		expect(result.email).toBe("knight@example.com");
	});

	it("отхвърля невалиден email", () => {
		expect(
			loginCredentialsValidator.safeParse({ email: "not-an-email", password: "x" }).success,
		).toBe(false);
	});

	it("при вход изисква само непразна парола", () => {
		expect(
			loginCredentialsValidator.safeParse({ email: "knight@example.com", password: "x" })
				.success,
		).toBe(true);
		expect(
			loginCredentialsValidator.safeParse({ email: "knight@example.com", password: "" })
				.success,
		).toBe(false);
	});

	it("при регистрация изисква поне 8 символа, както сървъра", () => {
		expect(
			registerCredentialsValidator.safeParse({
				email: "knight@example.com",
				password: "1234567",
			}).success,
		).toBe(false);
		expect(
			registerCredentialsValidator.safeParse({
				email: "knight@example.com",
				password: "12345678",
			}).success,
		).toBe(true);
	});

	it("отхвърля пароли над 128 символа, както сървъра", () => {
		expect(
			registerCredentialsValidator.safeParse({
				email: "knight@example.com",
				password: "x".repeat(129),
			}).success,
		).toBe(false);
	});

	it("разпознава auth съобщенията", () => {
		expect(authMessageValidator.safeParse({ type: "AUTH_LOGOUT" }).success).toBe(true);
		expect(authMessageValidator.safeParse({ type: "GET_STATUS" }).success).toBe(false);
	});
});
