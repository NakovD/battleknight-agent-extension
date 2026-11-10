import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMissionsMessageHandler } from "./missionsMessageHandler";

const loaded = {
	status: "loaded" as const,
	city: "Талфор",
	locations: [{ id: "Volcano", name: "Вулкан" }],
};

describe("createMissionsMessageHandler", () => {
	const worldMap = { read: vi.fn() };
	const duels = { getStatus: vi.fn() };
	const handle = createMissionsMessageHandler(worldMap, duels);

	beforeEach(() => {
		vi.resetAllMocks();
		duels.getStatus.mockResolvedValue({ status: "idle" });
	});

	it("връща null за чужди съобщения", () => {
		expect(handle({ type: "SETTINGS_LOAD" })).toBeNull();
		expect(handle({ type: "MISSIONS_READ_WORLD" })).toBeNull();
	});

	it("връща прочетените локации", async () => {
		worldMap.read.mockResolvedValue(loaded);

		expect(await handle({ type: "MISSIONS_LOAD_LOCATIONS" })).toEqual(loaded);
	});

	it("не пипа таба, докато агентът за дуели работи", async () => {
		duels.getStatus.mockResolvedValue({ status: "running" });

		expect(await handle({ type: "MISSIONS_LOAD_LOCATIONS" })).toEqual({
			status: "unavailable",
			reason: "duels-running",
		});
		expect(worldMap.read).not.toHaveBeenCalled();
	});

	it("неочаквана грешка се показва като недостъпна карта", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		worldMap.read.mockRejectedValue(new Error("boom"));

		expect(await handle({ type: "MISSIONS_LOAD_LOCATIONS" })).toEqual({
			status: "unavailable",
			reason: "world-unreachable",
		});
	});
});
