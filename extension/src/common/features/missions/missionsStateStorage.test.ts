import { beforeEach, describe, expect, it } from "vitest";
import type { MissionRecord } from "@/common/features/missions/models/missionsState";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";
import {
	appendMissionsHistory,
	MISSIONS_HISTORY_LIMIT,
	MISSIONS_HISTORY_STORAGE_KEY,
	MISSIONS_INITIAL_STATE,
	missionsAgentKey,
	readAllMissionsStates,
	readMissionsHistory,
	readMissionsState,
	removeMissionsState,
	tabIdOfMissionsAgentKey,
	updateMissionsState,
} from "./missionsStateStorage";

const record = (silver: number): MissionRecord => ({
	finishedAt: "2026-11-11T10:00:00.000Z",
	server: "s27-bg.battleknight.gameforge.com",
	city: "Талфор",
	location: { id: "Volcano", name: "Вулкан" },
	karma: "dark",
	size: "small",
	won: true,
	opponent: { id: "GhostTownPhoenix", name: "Феникс" },
	silver,
	payout: "Стандартна",
	experience: 5,
	karmaGained: 1,
	damageTaken: 0,
});

describe("missionsStateStorage", () => {
	let storage: ReturnType<typeof installChromeStorageMock>;

	beforeEach(() => {
		storage = installChromeStorageMock();
	});

	describe("състояние на таб", () => {
		it("празен storage дава началното състояние", async () => {
			expect(await readMissionsState(7)).toEqual(MISSIONS_INITIAL_STATE);
		});

		it("пази се в session storage, не в local", async () => {
			await updateMissionsState(7, { status: "running" });

			expect(storage.sessionStore[missionsAgentKey(7)]).toMatchObject({
				status: "running",
			});
			expect(storage.store).toEqual({});
		});

		it("всеки таб има отделно състояние", async () => {
			await updateMissionsState(7, { status: "running" });
			await updateMissionsState(9, { consecutiveNavigations: 3 });

			expect(await readMissionsState(7)).toMatchObject({
				status: "running",
				consecutiveNavigations: 0,
			});
			expect(await readMissionsState(9)).toMatchObject({
				status: "idle",
				consecutiveNavigations: 3,
			});
		});

		it("състояние, което не отговаря на схемата, започва отначало", async () => {
			storage.sessionStore[missionsAgentKey(7)] = {
				status: "running",
				stara: true,
			};

			expect(await readMissionsState(7)).toEqual(MISSIONS_INITIAL_STATE);
		});

		it("премахнатото състояние на таб се чете като начално", async () => {
			await updateMissionsState(7, { status: "running" });
			await removeMissionsState(7);

			expect(await readMissionsState(7)).toEqual(MISSIONS_INITIAL_STATE);
		});

		it("readAllMissionsStates връща всички табове и пропуска чужди ключове", async () => {
			await updateMissionsState(7, { status: "running" });
			await updateMissionsState(9, { status: "idle" });
			storage.sessionStore.someOtherKey = { status: "running" };

			const states = await readAllMissionsStates();

			expect([...states.keys()].sort()).toEqual([7, 9]);
			expect(states.get(7)?.status).toBe("running");
		});
	});

	it.each([
		["missionsAgent:12", 12],
		["missionsAgent:x", null],
		["missionsExtensionState", null],
		["duelsExtensionState", null],
	])("tabIdOfMissionsAgentKey(%s) = %s", (key, tabId) => {
		expect(tabIdOfMissionsAgentKey(key)).toBe(tabId);
	});

	describe("история", () => {
		it("пази най-новите мисии до лимита, в local storage", async () => {
			storage.store[MISSIONS_HISTORY_STORAGE_KEY] = Array.from(
				{ length: MISSIONS_HISTORY_LIMIT },
				(_, index) => record(index),
			);

			await appendMissionsHistory(record(9999));

			const history = await readMissionsHistory();
			expect(history).toHaveLength(MISSIONS_HISTORY_LIMIT);
			expect(history[0].silver).toBe(1);
			expect(history.at(-1)?.silver).toBe(9999);
		});

		it("записи отпреди сървъра да се пази все още се четат", async () => {
			const { server: _server, ...withoutServer } = record(100);
			storage.store[MISSIONS_HISTORY_STORAGE_KEY] = [withoutServer];

			expect(await readMissionsHistory()).toEqual([withoutServer]);
		});
	});
});
