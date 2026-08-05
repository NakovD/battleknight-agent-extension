import type { infer as ZodInfer, ZodType } from "zod";
import type {
	getExtensionMessageResponseSchema,
	getExtensionMessageSchema,
	getExtensionStateSchema,
} from "@/common/validators/extension";

export type ExtensionState<T extends ZodType> = ZodInfer<
	ReturnType<typeof getExtensionStateSchema<T>>
>;

export type ExtensionMessage<T extends ZodType> = ZodInfer<
	ReturnType<typeof getExtensionMessageSchema<T>>
>;

export type ExtensionMessageResponse<T extends ZodType> = ZodInfer<
	ReturnType<typeof getExtensionMessageResponseSchema<T>>
>;
