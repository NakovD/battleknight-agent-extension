import { number, object, string, enum as zodEnum } from "zod";

export const missionsFormValidator = object({
	location: object({ id: string(), name: string() })
		.nullable()
		.refine((location) => location !== null, "Choose a location"),
	karma: zodEnum(["light", "dark"]),
	size: zodEnum(["small", "medium", "large"]),
	// An emptied number input reads as NaN, which lands here as a type error.
	cooldownMinutes: number({ error: "Enter the cooldown in minutes" })
		.int("Use whole minutes")
		.min(1, "Cooldown must be at least 1 minute"),
});
