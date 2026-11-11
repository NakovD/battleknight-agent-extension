import { object, string, enum as zodEnum } from "zod";
import { missionLocationValidator } from "@/common/features/missions/validators/missionLocationsValidators";

export const missionKarmaValidator = zodEnum(["light", "dark"]);

export const missionSizeValidator = zodEnum(["small", "medium", "large"]);

/** What the agent needs to run missions — chosen in the popup's form. */
export const missionsSettingsValidator = object({
	location: missionLocationValidator,
	/** Where the location was found. A knight who travels away can't reach it. */
	city: string(),
	karma: missionKarmaValidator,
	size: missionSizeValidator,
});
