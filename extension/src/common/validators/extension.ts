import { discriminatedUnion, literal, object, string, type ZodType } from "zod";

export const ExtensionStateSchema = object({
	status: literal(["idle", "running", "error"]),
	errorMessage: string().nullable(),
});

export const ExtensionMessageSchema = <T extends ZodType>(schema: T) =>
	discriminatedUnion("type", [
		object({ type: literal("START_AGENT"), payload: schema }),
		object({ type: literal("STOP_AGENT") }),
		object({ type: literal("GET_STATUS") }),
		object({ type: literal("STATUS_UPDATE"), payload: ExtensionStateSchema }),
	]);

export const ExtensionMessageResponseSchema = discriminatedUnion("ok", [
	object({ ok: literal(true), state: ExtensionStateSchema }),
	object({ ok: literal(false), error: string() }),
]);
