import type {
	MissionRecord,
	MissionsState,
} from "@/common/features/missions/models/missionsState";
import {
	missionRecordValidator,
	missionsStateValidator,
} from "@/common/features/missions/validators/missionsStateValidators";

/**
 * Each game tab runs its own missions agent, so each has its own state, under
 * a key carrying the tab's id. The background and the content script both
 * read and write it, so they share these helpers and keys.
 *
 * Kept in chrome.storage.session, not local: tab ids only last until the
 * browser closes, and so does session storage. In local storage a stale id
 * could match a new tab after a restart and start an agent in it.
 */
const MISSIONS_AGENT_KEY_PREFIX = "missionsAgent:";

export const missionsAgentKey = (tabId: number) =>
	`${MISSIONS_AGENT_KEY_PREFIX}${tabId}`;

/** The tab a storage key belongs to, or null if it isn't a missions agent's. */
export const tabIdOfMissionsAgentKey = (key: string) => {
	if (!key.startsWith(MISSIONS_AGENT_KEY_PREFIX)) return null;

	const tabId = Number(key.slice(MISSIONS_AGENT_KEY_PREFIX.length));
	return Number.isInteger(tabId) ? tabId : null;
};

/** Where every agent's state lived before agents ran per tab. */
export const LEGACY_MISSIONS_STORAGE_KEY = "missionsExtensionState";

/** Shared by every tab, and kept across restarts — it is the statistics. */
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

type Area = "local" | "session";

const get = (area: Area, key: string | null) =>
	new Promise<Record<string, unknown>>((resolve) => {
		chrome.storage[area].get(key, (result) => resolve(result));
	});

const set = (area: Area, key: string, value: unknown) =>
	new Promise<void>((resolve) => {
		chrome.storage[area].set({ [key]: value }, () => resolve());
	});

/**
 * Checked on the way in: state written by an older version that no longer
 * fits starts over rather than breaking the popup.
 */
export const parseMissionsState = (raw: unknown): MissionsState => {
	const result = missionsStateValidator.safeParse(raw);
	return result.success ? result.data : MISSIONS_INITIAL_STATE;
};

export const readMissionsState = async (tabId: number) => {
	const key = missionsAgentKey(tabId);
	return parseMissionsState((await get("session", key))[key]);
};

export const writeMissionsState = (tabId: number, state: MissionsState) =>
	set("session", missionsAgentKey(tabId), state);

export const updateMissionsState = async (
	tabId: number,
	patch: Partial<MissionsState>,
) => {
	const next = { ...(await readMissionsState(tabId)), ...patch };
	await writeMissionsState(tabId, next);
	return next;
};

export const removeMissionsState = (tabId: number) =>
	new Promise<void>((resolve) => {
		chrome.storage.session.remove(missionsAgentKey(tabId), () => resolve());
	});

/** Every tab's agent, by tab id. */
export const readAllMissionsStates = async () => {
	const states = new Map<number, MissionsState>();

	for (const [key, raw] of Object.entries(await get("session", null))) {
		const tabId = tabIdOfMissionsAgentKey(key);
		if (tabId !== null) states.set(tabId, parseMissionsState(raw));
	}

	return states;
};

export const readMissionsHistory = async (): Promise<MissionRecord[]> => {
	const result = missionRecordValidator
		.array()
		.safeParse(
			(await get("local", MISSIONS_HISTORY_STORAGE_KEY))[
				MISSIONS_HISTORY_STORAGE_KEY
			],
		);
	return result.success ? result.data : [];
};

/** Newest last; the oldest drop off past the limit. */
export const appendMissionsHistory = async (record: MissionRecord) => {
	const history = await readMissionsHistory();
	await set(
		"local",
		MISSIONS_HISTORY_STORAGE_KEY,
		[...history, record].slice(-MISSIONS_HISTORY_LIMIT),
	);
};
