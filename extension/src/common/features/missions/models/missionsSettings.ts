import type { infer as ZodInfer } from "zod";
import type {
	missionKarmaValidator,
	missionSizeValidator,
	missionsSettingsValidator,
} from "@/common/features/missions/validators/missionsSettingsValidator";

export type MissionsSettings = ZodInfer<typeof missionsSettingsValidator>;

export type MissionKarma = ZodInfer<typeof missionKarmaValidator>;

export type MissionSize = ZodInfer<typeof missionSizeValidator>;
