import { beforeEach, describe, expect, it, vi } from "vitest";
import { MISSIONS_INITIAL_STATE } from "@/common/features/missions/missionsStateStorage";
import {
	createMissionsAgentMessageHandler,
	DUELS_RUNNING_ERROR,
} from "./missionsAgentMessageHandler";

const settings = {
	location: { id: "Volcano", name: "Вулкан" },
	city: "Талфор",
	karma: "light",
	size: "small",
};

describe("createMissionsAgentMessageHandler", () => {
	const missions = { start: vi.fn(), stop: vi.fn(), getStatus: vi.fn() };
	const duels = { getStatus: vi.fn() };
	const handle = createMissionsAgentMessageHandler(missions, duels);

	beforeEach(() => {
		vi.resetAllMocks();
		missions.getStatus.mockResolvedValue(MISSIONS_INITIAL_STATE);
		duels.getStatus.mockResolvedValue({ status: "idle" });
	});

	it("връща null за чужди съобщения", () => {
		expect(handle({ type: "START_AGENT", payload: {} })).toBeNull();
		expect(handle({ type: "MISSIONS_LOAD_LOCATIONS" })).toBeNull();
		expect(handle({ type: "MISSIONS_START", payload: {} })).toBeNull();
	});

	it("MISSIONS_START стартира агента с настройките", async () => {
		const reply = await handle({ type: "MISSIONS_START", payload: settings });

		expect(missions.start).toHaveBeenCalledWith(settings);
		expect(reply).toEqual({ ok: true, state: MISSIONS_INITIAL_STATE });
	});

	it("MISSIONS_START не стартира, докато дуелите работят", async () => {
		duels.getStatus.mockResolvedValue({ status: "running" });

		const reply = await handle({ type: "MISSIONS_START", payload: settings });

		expect(missions.start).not.toHaveBeenCalled();
		expect(reply).toEqual({ ok: false, error: DUELS_RUNNING_ERROR });
	});

	it("MISSIONS_STOP спира агента", async () => {
		await handle({ type: "MISSIONS_STOP" });

		expect(missions.stop).toHaveBeenCalled();
	});

	it("неочаквана грешка не стига до popup-а с детайлите си", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		missions.getStatus.mockRejectedValue(new Error("вътрешна грешка"));

		expect(await handle({ type: "MISSIONS_GET_STATUS" })).toEqual({
			ok: false,
			error: "Something went wrong. Please try again.",
		});
	});
});
