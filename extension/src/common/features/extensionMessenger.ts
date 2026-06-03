import type { ZodType } from "zod";
import type { IExtensionMessenger } from "@/common/models/extensionMessenger";
import type {
	ExtensionMessage,
	ExtensionMessageResponse,
} from "@/common/models/extenstion";
import {
	ExtensionMessageResponseSchema,
	getExtensionMessageSchema,
} from "@/common/validators/extension";

export const extensionMessenger: IExtensionMessenger = {
	send: <T extends ZodType>(msg: ExtensionMessage<T>) => {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage<ExtensionMessage<T>, ExtensionMessageResponse>(
				msg,
				(raw) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError.message);
						return;
					}
					const result = ExtensionMessageResponseSchema.safeParse(raw);

					if (!result.success) {
						reject(`Invalid response: ${result.error.message}`);
						return;
					}
					resolve(result.data);
				},
			);
		});
	},
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
