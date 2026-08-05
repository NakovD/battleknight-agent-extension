import type { ZodType } from "zod";
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
		new Promise<ExtensionMessageResponse<T>>((resolve, reject) => {
			chrome.runtime.sendMessage<
				ExtensionMessage<T>,
				ExtensionMessageResponse<T>
			>(msg, (raw) => {
				if (chrome.runtime.lastError) {
					reject(chrome.runtime.lastError.message);
					return;
				}
				const result = getExtensionMessageResponseSchema(schema).safeParse(raw);

				if (!result.success) {
					reject(`Invalid response: ${result.error.message}`);
					return;
				}
				resolve(result.data);
			});
		}),
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
