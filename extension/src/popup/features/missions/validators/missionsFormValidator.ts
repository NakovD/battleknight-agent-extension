import { object } from "zod";
import { missionLocationValidator } from "@/common/features/missions/validators/missionLocationsValidators";
import {
	missionKarmaValidator,
	missionSizeValidator,
} from "@/common/features/missions/validators/missionsSettingsValidator";

export const missionsFormValidator = object({
	location: missionLocationValidator
		.nullable()
		.refine((location) => location !== null, "Choose a location"),
	karma: missionKarmaValidator,
	size: missionSizeValidator,
});
