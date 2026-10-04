import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { duelsSettingsMessenger } from "@/common/features/duels/duelsSettingsMessenger";
import { extensionMessenger } from "@/common/features/extensionMessenger";
import { Duels } from "./Duels";

vi.mock("@/common/features/duels/duelsSettingsMessenger", () => ({
	duelsSettingsMessenger: { send: vi.fn() },
}));

vi.mock("@/common/features/extensionMessenger", () => ({
	extensionMessenger: { send: vi.fn(), listen: vi.fn(() => () => {}) },
}));

const settingsSend = vi.mocked(duelsSettingsMessenger.send);
const agentSend = vi.mocked(extensionMessenger.send);

const savedSettings = {
	levelMin: 10,
	levelMax: 40,
	lootFilterEnabled: true,
	lootMax: 3_000_000,
	skipAllOrders: false,
	skipSpecificOrders: false,
	ordersToSkip: [],
	cooldownMs: 300_000,
	rankingOffset: 1900,
};

const idleState = {
	status: "idle" as const,
	errorMessage: null,
	settings: null,
};

describe("Duels", () => {
	beforeEach(() => {
		// resetAllMocks, not clearAllMocks: the latter keeps queued mockResolvedValueOnce
		// values, so one failing test would leak its unconsumed response into the next.
		vi.resetAllMocks();
		agentSend.mockResolvedValue({ ok: true, state: idleState });
	});

	it("изчаква записаните настройки, преди да покаже формата", async () => {
		settingsSend.mockResolvedValue({ ok: true, settings: null });

		render(<Duels />);

		expect(screen.getByText("Loading settings...")).toBeInTheDocument();
		expect(
			await screen.findByRole("button", { name: "Start extension" }),
		).toBeInTheDocument();
		expect(settingsSend).toHaveBeenCalledWith({ type: "SETTINGS_LOAD" });
	});

	it("попълва формата със записаните настройки", async () => {
		settingsSend.mockResolvedValue({ ok: true, settings: savedSettings });

		const { container } = render(<Duels />);
		await screen.findByRole("button", { name: "Start extension" });

		// rankingOffset 1900 -> страница "1901-2000", cooldownMs 300000 -> 5 минути.
		// Заглавието на dropdown-а, защото същият текст стои и в списъка с опции.
		const pageDropdown = container.querySelector("summary") as HTMLElement;
		expect(pageDropdown).toHaveTextContent("1901-2000");

		// "5 min" стои и на плъзгача, и по скалата под него.
		expect(screen.getAllByText("5 min").length).toBeGreaterThan(0);
	});

	it("позволява старт веднага с възстановени настройки, без да се пипа формата", async () => {
		settingsSend.mockResolvedValue({ ok: true, settings: savedSettings });

		render(<Duels />);

		expect(await screen.findByRole("button", { name: "Start extension" })).toBeEnabled();
	});

	it("записва настройките в акаунта и стартира агента", async () => {
		settingsSend
			.mockResolvedValueOnce({ ok: true, settings: savedSettings })
			.mockResolvedValueOnce({ ok: true, settings: savedSettings });

		render(<Duels />);
		fireEvent.click(await screen.findByRole("button", { name: "Start extension" }));

		await waitFor(() =>
			expect(settingsSend).toHaveBeenLastCalledWith({
				type: "SETTINGS_SAVE",
				payload: savedSettings,
			}),
		);
		expect(agentSend).toHaveBeenCalledWith(
			expect.objectContaining({ type: "START_AGENT", payload: savedSettings }),
			expect.anything(),
		);
	});

	it("показва защо агентът е спрял сам", async () => {
		settingsSend.mockResolvedValue({ ok: true, settings: savedSettings });
		agentSend.mockResolvedValue({
			ok: true,
			state: {
				status: "idle",
				errorMessage:
					"None of the 100 knights on this ranking page matched your filters.",
				settings: savedSettings,
			},
		});

		render(<Duels />);

		expect(await screen.findByRole("status")).toHaveTextContent(
			"None of the 100 knights on this ranking page matched your filters.",
		);
		// Обяснението стои над формата, не вместо нея.
		expect(screen.getByRole("button", { name: "Start extension" })).toBeInTheDocument();
	});

	it("показва предупреждение, ако зареждането от акаунта се провали, но формата работи", async () => {
		settingsSend.mockResolvedValue({
			ok: false,
			error: "Could not reach the server. Please try again later.",
		});

		render(<Duels />);

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Could not reach the server. Please try again later.",
		);
		expect(screen.getByRole("button", { name: "Start extension" })).toBeInTheDocument();
	});

	it("стартира агента дори ако записът в акаунта се провали", async () => {
		settingsSend
			.mockResolvedValueOnce({ ok: true, settings: savedSettings })
			.mockResolvedValueOnce({ ok: false, error: "Your session has expired." });
		// Само START_AGENT отговаря с "running"; първоначалното GET_STATUS трябва да
		// остане idle, иначе формата изобщо не се показва.
		agentSend.mockImplementation(async (message) =>
			(message as { type: string }).type === "START_AGENT"
				? {
						ok: true,
						state: {
							status: "running",
							errorMessage: null,
							settings: savedSettings,
						},
					}
				: { ok: true, state: idleState },
		);

		render(<Duels />);
		fireEvent.click(await screen.findByRole("button", { name: "Start extension" }));

		expect(await screen.findByText("Extension is running")).toBeInTheDocument();
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Your session has expired.",
		);
	});
});
