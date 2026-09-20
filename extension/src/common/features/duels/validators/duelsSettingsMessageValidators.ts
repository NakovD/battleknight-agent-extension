import { discriminatedUnion, literal, object, string, type infer as ZodInfer } from "zod";
import { duelsSettingsValidator } from "@/common/features/duels/validators/duelsSettingsValidator";

export const settingsMessageValidator = discriminatedUnion("type", [
	object({ type: literal("SETTINGS_LOAD") }),
	object({ type: literal("SETTINGS_SAVE"), payload: duelsSettingsValidator }),
]);

/**
 * `settings: null` means there is nothing stored for this user — either nobody is
 * signed in, or (for SETTINGS_LOAD) the account has no saved settings yet. Both
 * leave the popup on its local defaults, so they don't need telling apart.
 */
export const settingsMessageResponseValidator = discriminatedUnion("ok", [
	object({ ok: literal(true), settings: duelsSettingsValidator.nullable() }),
	object({ ok: literal(false), error: string() }),
]);

export type SettingsMessage = ZodInfer<typeof settingsMessageValidator>;
export type SettingsMessageResponse = ZodInfer<
	typeof settingsMessageResponseValidator
>;
