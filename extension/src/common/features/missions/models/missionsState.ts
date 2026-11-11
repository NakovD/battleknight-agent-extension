import type { infer as ZodInfer } from "zod";
import type {
	missionRecordValidator,
	missionsAgentMessageValidator,
	missionsAgentResponseValidator,
	missionsStateValidator,
	missionsWaitValidator,
} from "@/common/features/missions/validators/missionsStateValidators";

export type MissionsState = ZodInfer<typeof missionsStateValidator>;

export type MissionRecord = ZodInfer<typeof missionRecordValidator>;

export type MissionsWait = ZodInfer<typeof missionsWaitValidator>;

export type MissionsAgentMessage = ZodInfer<
	typeof missionsAgentMessageValidator
>;

export type MissionsAgentResponse = ZodInfer<
	typeof missionsAgentResponseValidator
>;
