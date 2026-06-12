import type { infer as ZodInfer } from "zod";
import type { duelsSettingsValidator } from "../validators/duelsSettingsValidator";

export type DuelsSettings = ZodInfer<typeof duelsSettingsValidator>;
