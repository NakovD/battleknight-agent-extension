import type { ZodType } from "zod";
import type {
	ExtensionMessage,
	ExtensionMessageResponse,
} from "@/common/models/extenstion";

export interface IExtensionMessenger {
	send: <T extends ZodType>(
		msg: ExtensionMessage<T>,
	) => Promise<ExtensionMessageResponse>;
	listen: <T extends ZodType>(
		handler: (msg: ExtensionMessage<T>) => void,
		schema: T,
	) => () => void;
}
