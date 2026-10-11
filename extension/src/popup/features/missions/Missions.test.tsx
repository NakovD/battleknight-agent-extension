import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadMissionLocations } from "@/popup/features/missions/data/missionLocationsLoader";
import { Missions } from "./Missions";

vi.mock("@/popup/features/missions/data/missionLocationsLoader", () => ({
	loadMissionLocations: vi.fn(),
}));

const load = vi.mocked(loadMissionLocations);

describe("Missions", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("не зарежда локации, докато потребителят не натисне бутона", () => {
		render(<Missions />);

		expect(load).not.toHaveBeenCalled();
	});

	it("показва заредените локации", async () => {
		load.mockResolvedValue({
			status: "loaded",
			city: "Тестов град",
			locations: [{ id: "forest", name: "Гора" }],
		});

		render(<Missions />);
		fireEvent.click(screen.getByRole("button", { name: "Load locations" }));

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

		render(<Missions />);
		fireEvent.click(screen.getByRole("button", { name: "Load locations" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"returning from a duel",
		);
	});

	it("неуспешно зареждане се показва като недостъпна карта", async () => {
		load.mockRejectedValue(new Error("boom"));

		render(<Missions />);
		fireEvent.click(screen.getByRole("button", { name: "Load locations" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Could not open the world map",
		);
	});
});
