import type { infer as ZodInfer } from "zod";
import type { duelsFormValidator } from "@/popup/features/duels/validators/duelsFormValidator";

export type DuelsForm = ZodInfer<typeof duelsFormValidator>;
