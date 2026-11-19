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
	const missions = {
		start: vi.fn(),
		stop: vi.fn(),
		getStatus: vi.fn(),
		endHitPointsWait: vi.fn(),
	};
	const duels = { getStatus: vi.fn() };
	const openWorld = vi.fn();
	const handle = createMissionsAgentMessageHandler(missions, duels, openWorld);

	beforeEach(() => {
		vi.resetAllMocks();
		missions.getStatus.mockResolvedValue(MISSIONS_INITIAL_STATE);
		duels.getStatus.mockResolvedValue({ status: "idle" });
	});

	it("връща null за чужди съобщения", () => {
		expect(handle({ type: "START_AGENT", payload: {} })).toBeNull();
		expect(handle({ type: "MISSIONS_LOAD_LOCATIONS" })).toBeNull();
		expect(
			handle({ type: "MISSIONS_START", tabId: 7, payload: {} }),
		).toBeNull();
		// Без таб не е ясно чий агент се има предвид.
		expect(handle({ type: "MISSIONS_STOP" })).toBeNull();
	});

	it("MISSIONS_START стартира агента с настройките", async () => {
		const reply = await handle({
			type: "MISSIONS_START",
			tabId: 7,
			payload: settings,
		});

		expect(missions.start).toHaveBeenCalledWith(7, settings);
		expect(missions.getStatus).toHaveBeenCalledWith(7);
		expect(reply).toEqual({ ok: true, state: MISSIONS_INITIAL_STATE });
	});

	it("MISSIONS_START не стартира, докато дуелите работят", async () => {
		duels.getStatus.mockResolvedValue({ status: "running" });

		const reply = await handle({
			type: "MISSIONS_START",
			tabId: 7,
			payload: settings,
		});

		expect(missions.start).not.toHaveBeenCalled();
		expect(reply).toEqual({ ok: false, error: DUELS_RUNNING_ERROR });
	});

	it("MISSIONS_STOP спира агента", async () => {
		await handle({ type: "MISSIONS_STOP", tabId: 7 });

		expect(missions.stop).toHaveBeenCalledWith(7);
	});

	describe("MISSIONS_CHECK_NOW", () => {
		it("прекратява чакането за живот и тогава презарежда картата", async () => {
			const order: string[] = [];
			missions.endHitPointsWait.mockImplementation(async () => {
				order.push("край на чакането");
				return true;
			});
			openWorld.mockImplementation(async () => {
				order.push("картата");
			});

			const reply = await handle({ type: "MISSIONS_CHECK_NOW", tabId: 7 });

			// Обратният ред би заредил страница, която още вижда чакането.
			expect(order).toEqual(["край на чакането", "картата"]);
			expect(missions.endHitPointsWait).toHaveBeenCalledWith(7);
			expect(openWorld).toHaveBeenCalledWith(7);
			expect(reply).toEqual({ ok: true, state: MISSIONS_INITIAL_STATE });
		});

		it("без чакане за живот не навигира никъде", async () => {
			missions.endHitPointsWait.mockResolvedValue(false);

			await handle({ type: "MISSIONS_CHECK_NOW", tabId: 7 });

			expect(openWorld).not.toHaveBeenCalled();
		});
	});

	it("неочаквана грешка не стига до popup-а с детайлите си", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		missions.getStatus.mockRejectedValue(new Error("вътрешна грешка"));

		expect(await handle({ type: "MISSIONS_GET_STATUS", tabId: 7 })).toEqual({
			ok: false,
			error: "Something went wrong. Please try again.",
		});
	});
});
