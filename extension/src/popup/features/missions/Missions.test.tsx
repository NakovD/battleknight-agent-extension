import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { missionsAgentMessenger } from "@/common/features/missions/missionsAgentMessenger";
import { missionsMessenger } from "@/common/features/missions/missionsMessenger";
import { MISSIONS_INITIAL_STATE } from "@/common/features/missions/missionsStateStorage";
import type { MissionsState } from "@/common/features/missions/models/missionsState";
import { installChromeRuntimeMock } from "@/testUtils/chromeRuntimeMock";
import { Missions } from "./Missions";

vi.mock("@/common/features/missions/missionsMessenger", () => ({
	missionsMessenger: { loadLocations: vi.fn() },
}));

vi.mock("@/common/features/missions/missionsAgentMessenger", () => ({
	missionsAgentMessenger: { send: vi.fn() },
}));

const load = vi.mocked(missionsMessenger.loadLocations);
const agentSend = vi.mocked(missionsAgentMessenger.send);

const settings = {
	location: { id: "Volcano", name: "Вулкан" },
	city: "Талфор",
	karma: "dark" as const,
	size: "medium" as const,
};

const running: MissionsState = {
	...MISSIONS_INITIAL_STATE,
	status: "running",
	settings,
};

/** Рендира и изчаква първия статус, за да се покаже формата. */
const renderIdle = async () => {
	render(<Missions />);
	return screen.findByRole("button", { name: "Load locations" });
};

/** Табът, над който е отворен popup-ът. */
const TAB = 7;

const setActiveTab = (tab: Partial<chrome.tabs.Tab> | undefined) => {
	(globalThis.chrome as unknown as { tabs: unknown }).tabs = {
		query: vi.fn(async () => (tab ? [tab] : [])),
	};
};

describe("Missions", () => {
	let runtime: ReturnType<typeof installChromeRuntimeMock>;

	beforeEach(() => {
		vi.resetAllMocks();
		runtime = installChromeRuntimeMock();
		setActiveTab({
			id: TAB,
			url: "https://s27-bg.battleknight.gameforge.com/world",
		});
		agentSend.mockResolvedValue({ ok: true, state: MISSIONS_INITIAL_STATE });
	});

	describe("таб", () => {
		it("извън таб на играта казва да се отвори над таба с играта", async () => {
			setActiveTab({ id: TAB, url: "https://www.google.com/" });

			render(<Missions />);

			expect(await screen.findByRole("status")).toHaveTextContent(
				"Open this popup over the game tab",
			);
			expect(agentSend).not.toHaveBeenCalled();
		});

		it("пита за агента на таба, над който е отворен", async () => {
			await renderIdle();

			expect(agentSend).toHaveBeenCalledWith({
				type: "MISSIONS_GET_STATUS",
				tabId: TAB,
			});
		});

		it("зарежда локациите на своя таб", async () => {
			load.mockResolvedValue({ status: "loaded", city: "Т", locations: [] });

			fireEvent.click(await renderIdle());

			expect(load).toHaveBeenCalledWith(TAB);
		});
	});

	describe("форма", () => {
		it("не зарежда локации, докато потребителят не натисне бутона", async () => {
			await renderIdle();

			expect(load).not.toHaveBeenCalled();
		});

		it("показва заредените локации", async () => {
			load.mockResolvedValue({
				status: "loaded",
				city: "Тестов град",
				locations: [{ id: "forest", name: "Гора" }],
			});

			fireEvent.click(await renderIdle());

			expect(
				await screen.findByRole("button", { name: "Гора" }),
			).toBeInTheDocument();
			expect(screen.getByText("Тестов град")).toBeInTheDocument();
		});

		it("показва причината, когато рицарят е зает", async () => {
			load.mockResolvedValue({
				status: "unavailable",
				reason: "returning-from-duel",
			});

			fireEvent.click(await renderIdle());

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"returning from a duel",
			);
		});

		it("неуспешно зареждане се показва като недостъпна карта", async () => {
			load.mockRejectedValue(new Error("boom"));

			fireEvent.click(await renderIdle());

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Could not open the world map",
			);
		});

		it("показва защо агентът е спрял сам", async () => {
			agentSend.mockResolvedValue({
				ok: true,
				state: {
					...MISSIONS_INITIAL_STATE,
					errorMessage: "No mission points left",
				},
			});

			await renderIdle();

			expect(screen.getByText("No mission points left")).toBeInTheDocument();
		});
	});

	it("не показва формата, преди да знае дали агентът вече работи", async () => {
		agentSend.mockReturnValue(new Promise(() => {}));

		render(<Missions />);

		await vi.waitFor(() => expect(agentSend).toHaveBeenCalled());
		expect(screen.getByText("Loading...")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Load locations" })).toBeNull();
	});

	it("стартира с избраните настройки и града на картата", async () => {
		load.mockResolvedValue({
			status: "loaded",
			city: "Талфор",
			locations: [{ id: "Volcano", name: "Вулкан" }],
		});

		fireEvent.click(await renderIdle());
		fireEvent.click(await screen.findByRole("button", { name: "Вулкан" }));
		for (const title of ["Karma", "Mission size"]) {
			fireEvent.click(screen.getByRole("button", { name: "Next" }));
			await screen.findByRole("heading", { name: title });
		}
		agentSend.mockResolvedValue({ ok: true, state: running });
		fireEvent.click(screen.getByRole("button", { name: "Start missions" }));

		expect(
			await screen.findByText("Missions are running on s27-bg"),
		).toBeInTheDocument();
		expect(agentSend).toHaveBeenCalledWith({
			type: "MISSIONS_START",
			tabId: TAB,
			payload: {
				location: { id: "Volcano", name: "Вулкан" },
				city: "Талфор",
				karma: "light",
				size: "small",
			},
		});
	});

	describe("докато агентът работи", () => {
		beforeEach(() => {
			agentSend.mockResolvedValue({ ok: true, state: running });
		});

		it("показва настройките и бутон за спиране", async () => {
			render(<Missions />);

			expect(await screen.findByText("Вулкан, Талфор")).toBeInTheDocument();
			expect(screen.getByText("Medium, dark karma")).toBeInTheDocument();
		});

		it("показва какво чака и колко още", async () => {
			agentSend.mockResolvedValue({
				ok: true,
				state: {
					...running,
					wait: { until: Date.now() + 125_000, reason: "returning" },
				},
			});

			render(<Missions />);

			expect(await screen.findByRole("status")).toHaveTextContent(
				/Next mission in 2:0[45]/,
			);
		});

		it("показва последната мисия и статистиката", async () => {
			agentSend.mockResolvedValue({
				ok: true,
				state: {
					...running,
					lastMission: {
						finishedAt: "2026-11-11T10:00:00.000Z",
						city: "Талфор",
						location: { id: "Volcano", name: "Вулкан" },
						karma: "dark",
						size: "medium",
						won: true,
						opponent: { id: "GhostTownPhoenix", name: "Феникс" },
						silver: 1163,
						payout: "Стандартна печалба от",
						experience: 5,
						karmaGained: 1,
						damageTaken: 0,
					},
					run: { missions: 4, wins: 3, losses: 1, silver: 4321 },
				},
			});

			render(<Missions />);

			expect(await screen.findByText("Won against Феникс")).toBeInTheDocument();
			expect(screen.getByText("3 / 1")).toBeInTheDocument();
		});

		it("Stop спира агента", async () => {
			render(<Missions />);

			fireEvent.click(
				await screen.findByRole("button", { name: "Stop missions" }),
			);

			expect(agentSend).toHaveBeenCalledWith({
				type: "MISSIONS_STOP",
				tabId: TAB,
			});
		});

		it("обновява се от съобщенията на background-а", async () => {
			render(<Missions />);
			await screen.findByText("Missions are running on s27-bg");

			act(() => {
				runtime.dispatchMessage({
					type: "MISSIONS_STATUS_UPDATE",
					tabId: TAB,
					payload: {
						...running,
						run: { missions: 9, wins: 9, losses: 0, silver: 0 },
					},
				});
			});

			expect(screen.getByText("9 / 0")).toBeInTheDocument();
		});

		it("не показва статуса на агент от друг таб", async () => {
			render(<Missions />);
			await screen.findByText("Missions are running on s27-bg");

			act(() => {
				runtime.dispatchMessage({
					type: "MISSIONS_STATUS_UPDATE",
					tabId: 9,
					payload: {
						...running,
						run: { missions: 9, wins: 9, losses: 0, silver: 0 },
					},
				});
			});

			expect(screen.queryByText("9 / 0")).toBeNull();
		});
	});

	describe("грешки", () => {
		it("показва защо стартът е отказан и Back връща към формата", async () => {
			agentSend.mockImplementation(async (message) =>
				message.type === "MISSIONS_START"
					? { ok: false, error: "The duels agent is running." }
					: { ok: true, state: MISSIONS_INITIAL_STATE },
			);
			load.mockResolvedValue({
				status: "loaded",
				city: "Талфор",
				locations: [{ id: "Volcano", name: "Вулкан" }],
			});

			fireEvent.click(await renderIdle());
			fireEvent.click(await screen.findByRole("button", { name: "Вулкан" }));
			for (const title of ["Karma", "Mission size"]) {
				fireEvent.click(screen.getByRole("button", { name: "Next" }));
				await screen.findByRole("heading", { name: title });
			}
			fireEvent.click(screen.getByRole("button", { name: "Start missions" }));

			expect(
				await screen.findByText("The duels agent is running."),
			).toBeInTheDocument();

			fireEvent.click(screen.getByRole("button", { name: "Go back" }));

			expect(
				await screen.findByRole("button", { name: /locations/ }),
			).toBeInTheDocument();
		});

		it("Back от записана грешка я изчиства чрез Stop", async () => {
			agentSend.mockResolvedValue({
				ok: true,
				state: {
					...MISSIONS_INITIAL_STATE,
					status: "error",
					errorMessage: "going round in circles",
				},
			});

			render(<Missions />);
			fireEvent.click(await screen.findByRole("button", { name: "Go back" }));

			expect(agentSend).toHaveBeenCalledWith({
				type: "MISSIONS_STOP",
				tabId: TAB,
			});
		});
	});
});
