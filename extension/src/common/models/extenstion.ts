import type { infer as ZodInfer, ZodType } from "zod";
import type {
	ExtensionMessageResponseSchema,
	ExtensionMessageSchema,
	ExtensionStateSchema,
} from "@/common/validators/extension";

export type ExtensionState = ZodInfer<typeof ExtensionStateSchema>;

export type ExtensionMessageType<T extends ZodType> = ZodInfer<
	ReturnType<typeof ExtensionMessageSchema<T>>
>;

export type ExtensionMessageResponse = ZodInfer<
	typeof ExtensionMessageResponseSchema
>;
