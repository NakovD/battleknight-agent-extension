import { discriminatedUnion, literal, object, string, type ZodType } from "zod";

export const getExtensionStateSchema = <T extends ZodType>(settingsSchema: T) =>
	object({
		status: literal(["idle", "running", "error"]),
		errorMessage: string().nullable(),
		settings: settingsSchema.nullable(),
	});

export const getExtensionMessageSchema = <T extends ZodType>(schema: T) =>
	discriminatedUnion("type", [
		object({ type: literal("START_AGENT"), payload: schema }),
		object({ type: literal("STOP_AGENT") }),
		object({ type: literal("GET_STATUS") }),
		object({
			type: literal("STATUS_UPDATE"),
			payload: getExtensionStateSchema(schema),
		}),
	]);

export const getExtensionMessageResponseSchema = <T extends ZodType>(schema: T) =>
	discriminatedUnion("ok", [
		object({ ok: literal(true), state: getExtensionStateSchema(schema) }),
		object({ ok: literal(false), error: string() }),
	]);
