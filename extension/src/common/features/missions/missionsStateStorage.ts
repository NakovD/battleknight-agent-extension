import type {
	MissionRecord,
	MissionsState,
} from "@/common/features/missions/models/missionsState";
import {
	missionRecordValidator,
	missionsStateValidator,
} from "@/common/features/missions/validators/missionsStateValidators";

/**
 * The missions agent's state in chrome.storage.local. The background and the
 * content script both read and write it, so they share these helpers and keys.
 */
export const MISSIONS_STORAGE_KEY = "missionsExtensionState";
export const MISSIONS_HISTORY_STORAGE_KEY = "missionsHistory";

/** Enough for statistics; chrome.storage.local isn't meant for more. */
export const MISSIONS_HISTORY_LIMIT = 500;

export const MISSIONS_INITIAL_STATE: MissionsState = {
	status: "idle",
	errorMessage: null,
	settings: null,
	wait: null,
	isMissionPending: false,
	lastMission: null,
	run: { missions: 0, wins: 0, losses: 0, silver: 0 },
	consecutiveNavigations: 0,
};

const get = (key: string) =>
	new Promise<unknown>((resolve) => {
		chrome.storage.local.get(key, (result) => resolve(result[key]));
	});

const set = (key: string, value: unknown) =>
	new Promise<void>((resolve) => {
		chrome.storage.local.set({ [key]: value }, () => resolve());
	});

/**
 * Checked on the way in: state written by an older version that no longer
 * fits starts over rather than breaking the popup.
 */
export const parseMissionsState = (raw: unknown): MissionsState => {
	const result = missionsStateValidator.safeParse(raw);
	return result.success ? result.data : MISSIONS_INITIAL_STATE;
};

export const readMissionsState = async () =>
	parseMissionsState(await get(MISSIONS_STORAGE_KEY));

export const writeMissionsState = (state: MissionsState) =>
	set(MISSIONS_STORAGE_KEY, state);

export const updateMissionsState = async (patch: Partial<MissionsState>) => {
	const next = { ...(await readMissionsState()), ...patch };
	await writeMissionsState(next);
	return next;
};

export const readMissionsHistory = async (): Promise<MissionRecord[]> => {
	const result = missionRecordValidator
		.array()
		.safeParse(await get(MISSIONS_HISTORY_STORAGE_KEY));
	return result.success ? result.data : [];
};

/** Newest last; the oldest drop off past the limit. */
export const appendMissionsHistory = async (record: MissionRecord) => {
	const history = await readMissionsHistory();
	await set(
		MISSIONS_HISTORY_STORAGE_KEY,
		[...history, record].slice(-MISSIONS_HISTORY_LIMIT),
	);
};
