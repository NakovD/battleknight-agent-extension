import {
	boolean,
	discriminatedUnion,
	literal,
	number,
	object,
	string,
	enum as zodEnum,
} from "zod";
import { missionLocationValidator } from "@/common/features/missions/validators/missionLocationsValidators";
import {
	missionKarmaValidator,
	missionSizeValidator,
	missionsSettingsValidator,
} from "@/common/features/missions/validators/missionsSettingsValidator";

/**
 * One finished mission, as its report showed it. Every number is nullable: the
 * report's wording is translated, and a figure we couldn't find is better
 * stored as unknown than as zero.
 */
export const missionRecordValidator = object({
	finishedAt: string(),
	city: string(),
	location: missionLocationValidator,
	karma: missionKarmaValidator,
	size: missionSizeValidator,
	won: boolean(),
	opponent: object({
		/** The class on #challengerImage — the same in every language. */
		id: string().nullable(),
		name: string().nullable(),
	}),
	silver: number().nullable(),
	/** As the game wrote it: Стандартна, Голяма, Феноменална... */
	payout: string().nullable(),
	experience: number().nullable(),
	karmaGained: number().nullable(),
	damageTaken: number().nullable(),
});

/**
 * - returning: the game's countdown, plus the random delay on top;
 * - hit-points: waiting for them to come back, checking now and then;
 * - retry: something couldn't be read; look again shortly.
 */
export const missionsWaitValidator = object({
	until: number(),
	reason: zodEnum(["returning", "hit-points", "retry"]),
});

export const missionsRunStatsValidator = object({
	missions: number(),
	wins: number(),
	losses: number(),
	silver: number(),
});

export const missionsStateValidator = object({
	status: literal(["idle", "running", "error"]),
	/** Why the agent stopped, or what went wrong. */
	errorMessage: string().nullable(),
	settings: missionsSettingsValidator.nullable(),
	wait: missionsWaitValidator.nullable(),
	/**
	 * A mission was started and its report not read yet. Without it, a report
	 * page opened again would be counted twice.
	 */
	isMissionPending: boolean(),
	lastMission: missionRecordValidator.nullable(),
	/** Since the last Start. */
	run: missionsRunStatsValidator,
	/** See the circuit breaker in runMissionStep. */
	consecutiveNavigations: number(),
});

export const missionsAgentMessageValidator = discriminatedUnion("type", [
	object({
		type: literal("MISSIONS_START"),
		payload: missionsSettingsValidator,
	}),
	object({ type: literal("MISSIONS_STOP") }),
	object({ type: literal("MISSIONS_GET_STATUS") }),
]);

export const missionsAgentResponseValidator = discriminatedUnion("ok", [
	object({ ok: literal(true), state: missionsStateValidator }),
	object({ ok: literal(false), error: string() }),
]);

/** Background → popup, whenever the state changes. */
export const missionsStatusUpdateValidator = object({
	type: literal("MISSIONS_STATUS_UPDATE"),
	payload: missionsStateValidator,
});
