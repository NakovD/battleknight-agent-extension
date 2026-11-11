import type { infer as ZodInfer } from "zod";
import type { missionsFormValidator } from "@/popup/features/missions/validators/missionsFormValidator";

export type MissionsForm = ZodInfer<typeof missionsFormValidator>;
