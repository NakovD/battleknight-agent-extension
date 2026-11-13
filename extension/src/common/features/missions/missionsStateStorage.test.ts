import { beforeEach, describe, expect, it } from "vitest";
import type { MissionRecord } from "@/common/features/missions/models/missionsState";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";
import {
	appendMissionsHistory,
	MISSIONS_HISTORY_LIMIT,
	MISSIONS_HISTORY_STORAGE_KEY,
	MISSIONS_INITIAL_STATE,
	MISSIONS_STORAGE_KEY,
	readMissionsHistory,
	readMissionsState,
	updateMissionsState,
} from "./missionsStateStorage";

const record = (silver: number): MissionRecord => ({
	finishedAt: "2026-11-11T10:00:00.000Z",
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

	it("празен storage дава началното състояние", async () => {
		expect(await readMissionsState()).toEqual(MISSIONS_INITIAL_STATE);
	});

	it("състояние, което не отговаря на схемата, започва отначало", async () => {
		storage.store[MISSIONS_STORAGE_KEY] = { status: "running", stara: true };

		expect(await readMissionsState()).toEqual(MISSIONS_INITIAL_STATE);
	});

	it("updateMissionsState слива промяната с текущото състояние", async () => {
		await updateMissionsState({ status: "running" });
		await updateMissionsState({ consecutiveNavigations: 2 });

		expect(await readMissionsState()).toMatchObject({
			status: "running",
			consecutiveNavigations: 2,
		});
	});

	it("историята пази най-новите мисии до лимита", async () => {
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
});
