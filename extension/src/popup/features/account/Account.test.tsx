import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authMessenger } from "@/common/features/auth/authMessenger";
import { Account } from "./Account";

vi.mock("@/common/features/auth/authMessenger", () => ({
	authMessenger: { send: vi.fn() },
}));

const send = vi.mocked(authMessenger.send);

const signedIn = {
	status: "signedIn" as const,
	email: "knight@example.com",
	expiresAt: "2026-09-24T12:00:00Z",
};

const fillAndSubmit = (
	container: HTMLElement,
	email: string,
	password: string,
	submitLabel: string,
) => {
	fireEvent.change(container.querySelector('input[name="email"]') as HTMLElement, {
		target: { value: email },
	});
	fireEvent.change(container.querySelector('input[name="password"]') as HTMLElement, {
		target: { value: password },
	});
	fireEvent.click(screen.getByRole("button", { name: submitLabel }));
};

describe("Account", () => {
	beforeEach(() => {
		send.mockReset();
	});

	it("показва формата за вход, когато потребителят не е влязъл", async () => {
		send.mockResolvedValue({ ok: true, account: { status: "signedOut" } });

		render(<Account />);

		expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
		expect(send).toHaveBeenCalledWith({ type: "AUTH_GET_ACCOUNT" });
	});

	it("показва email-а и бутон за изход, когато потребителят е влязъл", async () => {
		send.mockResolvedValue({ ok: true, account: signedIn });

		render(<Account />);

		expect(await screen.findByText("knight@example.com")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
	});

	it("влиза с въведените данни и показва акаунта", async () => {
		send
			.mockResolvedValueOnce({ ok: true, account: { status: "signedOut" } })
			.mockResolvedValueOnce({ ok: true, account: signedIn });
		const { container } = render(<Account />);
		await screen.findByRole("button", { name: "Sign in" });

		fillAndSubmit(container, "knight@example.com", "super-secret-passphrase", "Sign in");

		expect(await screen.findByText("knight@example.com")).toBeInTheDocument();
		expect(send).toHaveBeenLastCalledWith({
			type: "AUTH_LOGIN",
			payload: { email: "knight@example.com", password: "super-secret-passphrase" },
		});
	});

	it("показва грешката от сървъра и остава на формата", async () => {
		send
			.mockResolvedValueOnce({ ok: true, account: { status: "signedOut" } })
			.mockResolvedValueOnce({ ok: false, error: "Invalid email or password." });
		const { container } = render(<Account />);
		await screen.findByRole("button", { name: "Sign in" });

		fillAndSubmit(container, "knight@example.com", "wrong-password", "Sign in");

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Invalid email or password.",
		);
		expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
	});

	it("при регистрация не праща къса парола, а показва валидационна грешка", async () => {
		send.mockResolvedValue({ ok: true, account: { status: "signedOut" } });
		const { container } = render(<Account />);
		fireEvent.click(
			await screen.findByRole("button", { name: "No account yet? Create one" }),
		);

		fillAndSubmit(container, "knight@example.com", "short", "Create account");

		expect(
			await screen.findByText("Password must be at least 8 characters"),
		).toBeInTheDocument();
		expect(send).toHaveBeenCalledTimes(1); // само първоначалното AUTH_GET_ACCOUNT
	});

	it("регистрира с AUTH_REGISTER", async () => {
		send
			.mockResolvedValueOnce({ ok: true, account: { status: "signedOut" } })
			.mockResolvedValueOnce({ ok: true, account: signedIn });
		const { container } = render(<Account />);
		fireEvent.click(
			await screen.findByRole("button", { name: "No account yet? Create one" }),
		);

		fillAndSubmit(container, "knight@example.com", "super-secret-passphrase", "Create account");

		await screen.findByText("knight@example.com");
		expect(send).toHaveBeenLastCalledWith({
			type: "AUTH_REGISTER",
			payload: { email: "knight@example.com", password: "super-secret-passphrase" },
		});
	});

	it("изход връща формата за вход", async () => {
		send
			.mockResolvedValueOnce({ ok: true, account: signedIn })
			.mockResolvedValueOnce({ ok: true, account: { status: "signedOut" } });
		render(<Account />);

		fireEvent.click(await screen.findByRole("button", { name: "Log out" }));

		expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
		expect(send).toHaveBeenLastCalledWith({ type: "AUTH_LOGOUT" });
	});

	it("показва съобщение, ако background-ът не отговаря", async () => {
		send.mockRejectedValue("Could not establish connection. Receiving end does not exist.");

		render(<Account />);

		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Could not reach the extension. Try reopening the popup.",
			),
		);
		expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
	});
});
