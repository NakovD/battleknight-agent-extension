import type { infer as ZodInfer, ZodType } from "zod";
import type {
	ExtensionMessageResponseSchema,
	ExtensionStateSchema,
	getExtensionMessageSchema,
} from "@/common/validators/extension";

export type ExtensionState = ZodInfer<typeof ExtensionStateSchema>;

export type ExtensionMessage<T extends ZodType> = ZodInfer<
	ReturnType<typeof getExtensionMessageSchema<T>>
>;

export type ExtensionMessageResponse = ZodInfer<
	typeof ExtensionMessageResponseSchema
>;
