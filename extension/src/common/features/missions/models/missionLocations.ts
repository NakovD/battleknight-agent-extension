import type { infer as ZodInfer } from "zod";
import type {
	missionLocationsResultValidator,
	missionLocationValidator,
	missionsUnavailableReasonValidator,
} from "@/common/features/missions/validators/missionLocationsValidators";

export type MissionLocation = ZodInfer<typeof missionLocationValidator>;

export type MissionsUnavailableReason = ZodInfer<
	typeof missionsUnavailableReasonValidator
>;

export type MissionLocationsResult = ZodInfer<
	typeof missionLocationsResultValidator
>;
