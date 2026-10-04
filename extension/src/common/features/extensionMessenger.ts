import type { ZodType } from "zod";
import { sendRuntimeMessage } from "@/common/features/runtimeMessaging";
import type {
	ExtensionMessage,
	ExtensionMessageResponse,
} from "@/common/models/extension";
import type { IExtensionMessenger } from "@/common/models/extensionMessenger";
import {
	getExtensionMessageResponseSchema,
	getExtensionMessageSchema,
} from "@/common/validators/extension";

export const extensionMessenger: IExtensionMessenger = {
	send: <T extends ZodType>(msg: ExtensionMessage<T>, schema: T) =>
		sendRuntimeMessage(
			msg,
			getExtensionMessageResponseSchema(schema),
		) as Promise<ExtensionMessageResponse<T>>,
	listen: (handler, schema) => {
		const listener = (raw: unknown) => {
			const result = getExtensionMessageSchema(schema).safeParse(raw);
			if (!result.success) return;
			handler(result.data);
		};
		chrome.runtime.onMessage.addListener(listener);
		return () => chrome.runtime.onMessage.removeListener(listener);
	},
};
