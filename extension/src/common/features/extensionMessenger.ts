import type { ZodType } from "zod";
import type {
	ExtensionMessage,
	ExtensionMessageResponse,
} from "@/common/models/extension";
import type { IExtensionMessenger } from "@/common/models/extensionMessenger";
import {
	ExtensionMessageResponseSchema,
	getExtensionMessageSchema,
} from "@/common/validators/extension";

const extensionMessengerImplementation: IExtensionMessenger = {
	send: <T extends ZodType>(msg: ExtensionMessage<T>) =>
		new Promise((resolve, reject) => {
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

const extensionMessengerMock: IExtensionMessenger = {
	send: <T extends ZodType>(msg: ExtensionMessage<T>) =>
		new Promise((resolve) => {
			console.log("Mock send called with:", msg);
			resolve({ state: { status: "running", errorMessage: "" }, ok: true });
		}),
	listen: (handler, schema) => {
		console.log("Mock listen registered");
		handler({
			type: "STATUS_UPDATE",
			payload: { status: "running", errorMessage: "" },
		});
		return () => console.log("Mock listen unregistered");
	},
};

export const extensionMessenger = extensionMessengerMock; //extensionMessengerImplementation;
