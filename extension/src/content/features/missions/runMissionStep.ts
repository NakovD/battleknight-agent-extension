import {
	appendMissionsHistory,
	readMissionsState,
	updateMissionsState,
} from "@/common/features/missions/missionsStateStorage";
import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import type {
	MissionRecord,
	MissionsState,
} from "@/common/features/missions/models/missionsState";
import { decideMissionStep } from "@/content/features/missions/decideMissionStep";

/**
 * Circuit breaker: this many navigations in a row without finishing a mission
 * or settling into a deliberate wait means something is going round in
 * circles — the agent stops itself rather than rely on someone pressing Stop.
 */
export const MAX_CONSECUTIVE_NAVIGATIONS = 8;

const missionKarmaValues: Record<MissionsSettings["karma"], string> = {
	light: "Good",
	dark: "Evil",
};

export interface IMissionStepDeps {
	doc: Document;
	now: () => number;
	random: () => number;
	navigate: (url: string) => void;
	submit: (form: HTMLFormElement) => void;
}

const defaultDeps: IMissionStepDeps = {
	doc: document,
	now: Date.now,
	random: Math.random,
	navigate: (url) => {
		window.location.href = url;
	},
	submit: (form) => form.submit(),
};

/**
 * Guards against overlapping steps: page load, the Start button and the tab
 * coming back to the front can all ask for one at once, and two steps reading
 * the same state could start two missions.
 */
let isStepInFlight = false;

/** One timer at a time; a new wait replaces the old. */
let waitTimer: ReturnType<typeof setTimeout> | null = null;

/** Takes one step of the missions agent, if it is running and no step is. */
export const runMissionStep = async (
	deps: IMissionStepDeps = defaultDeps,
): Promise<void> => {
	if (isStepInFlight) return;

	isStepInFlight = true;

	try {
		await executeMissionStep(deps);
	} finally {
		isStepInFlight = false;
	}
};

const executeMissionStep = async (deps: IMissionStepDeps) => {
	const state = await readMissionsState();
	if (state.status !== "running") return;

	if (!state.settings) {
		await updateMissionsState({
			status: "error",
			errorMessage: "The missions agent is running but has no settings.",
		});
		return;
	}

	const settings = state.settings;
	const worldUrl = `${deps.doc.location.origin}/world`;

	try {
		const step = decideMissionStep(deps.doc, state, settings, {
			now: deps.now(),
			random: deps.random,
		});

		switch (step.action) {
			case "wait":
				// The same wait again only needs its timer back, not another write.
				if (step.wait !== state.wait) {
					await updateMissionsState({
						wait: step.wait,
						consecutiveNavigations: 0,
					});
				}

				scheduleWaitEnd(step.wait.until - deps.now(), deps, worldUrl);
				break;

			case "go-to-world":
				if (await tripCircuitBreaker(state)) break;

				await updateMissionsState({
					wait: null,
					consecutiveNavigations: state.consecutiveNavigations + 1,
				});
				deps.navigate(worldUrl);
				break;

			case "start-mission": {
				if (await tripCircuitBreaker(state)) break;

				const form = fillMissionForm(deps.doc, settings);

				if (!form) {
					await stop(
						"Could not find the game's mission form. The game's layout may have changed.",
					);
					break;
				}

				// Pending before submitting, so the report it leads to is recognised.
				await updateMissionsState({
					wait: null,
					isMissionPending: true,
					consecutiveNavigations: state.consecutiveNavigations + 1,
				});
				deps.submit(form);
				break;
			}

			case "record": {
				const record: MissionRecord = {
					...step.report,
					finishedAt: new Date(deps.now()).toISOString(),
					city: settings.city,
					location: settings.location,
					karma: settings.karma,
					size: settings.size,
				};

				await appendMissionsHistory(record);
				await updateMissionsState({
					isMissionPending: false,
					lastMission: record,
					run: addToRun(state.run, record),
					wait: null,
					// A finished mission is progress; the walk to /world starts afresh.
					consecutiveNavigations: 1,
				});
				deps.navigate(worldUrl);
				break;
			}

			case "stop":
				await stop(step.reason);
				break;
		}
	} catch (err) {
		await updateMissionsState({
			status: "error",
			errorMessage: err instanceof Error ? err.message : String(err),
			wait: null,
		});
	}
};

/**
 * Fills in the game's own mission form, as its chooseMission() would.
 *
 * buyRubies is always 0: rubies are real money, and the agent never spends
 * them. See docs/MISSIONS.md.
 */
const fillMissionForm = (doc: Document, settings: MissionsSettings) => {
	const form = doc.getElementById("formChooseMission");
	if (!(form instanceof HTMLFormElement)) return null;

	const fields: Record<string, string> = {
		chooseMission: settings.location.id,
		missionArt: settings.size,
		missionKarma: missionKarmaValues[settings.karma],
		buyRubies: "0",
	};

	for (const [name, value] of Object.entries(fields)) {
		const input = form.elements.namedItem(name);
		if (!(input instanceof HTMLInputElement)) return null;
		input.value = value;
	}

	return form;
};

const tripCircuitBreaker = async (state: MissionsState) => {
	if (state.consecutiveNavigations + 1 < MAX_CONSECUTIVE_NAVIGATIONS) {
		return false;
	}

	await updateMissionsState({
		status: "error",
		errorMessage: `The missions agent stopped itself after ${MAX_CONSECUTIVE_NAVIGATIONS} page changes in a row without finishing a mission — it seems to be going round in circles.`,
		wait: null,
		isMissionPending: false,
		consecutiveNavigations: 0,
	});
	return true;
};

const stop = (reason: string) =>
	updateMissionsState({
		status: "idle",
		errorMessage: reason,
		wait: null,
		isMissionPending: false,
		consecutiveNavigations: 0,
	});

const addToRun = (run: MissionsState["run"], record: MissionRecord) => ({
	missions: run.missions + 1,
	wins: run.wins + (record.won ? 1 : 0),
	losses: run.losses + (record.won ? 0 : 1),
	silver: run.silver + (record.silver ?? 0),
});

/**
 * When the wait is over, open /world afresh: the countdown on the page is a
 * snapshot, and reading it again would only start another wait.
 */
const scheduleWaitEnd = (
	delayMs: number,
	deps: IMissionStepDeps,
	worldUrl: string,
) => {
	if (waitTimer) clearTimeout(waitTimer);

	waitTimer = setTimeout(
		async () => {
			waitTimer = null;

			const state = await readMissionsState();
			// Stopped meanwhile, or started over with another wait.
			if (state.status !== "running" || !state.wait) return;
			if (deps.now() < state.wait.until) return;

			await updateMissionsState({ wait: null, consecutiveNavigations: 1 });
			deps.navigate(worldUrl);
		},
		Math.max(0, delayMs),
	);
};

/** For tests: forget the timer and the in-flight guard between them. */
export const resetMissionStepForTests = () => {
	if (waitTimer) clearTimeout(waitTimer);
	waitTimer = null;
	isStepInFlight = false;
};
