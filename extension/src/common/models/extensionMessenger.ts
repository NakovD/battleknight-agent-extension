import type { ZodType } from "zod";
import type {
	ExtensionMessage,
	ExtensionMessageResponse,
} from "@/common/models/extension";

export interface IExtensionMessenger {
	send: <T extends ZodType>(
		msg: ExtensionMessage<T>,
		schema: T,
	) => Promise<ExtensionMessageResponse<T>>;
	listen: <T extends ZodType>(
		handler: (msg: ExtensionMessage<T>) => void,
		schema: T,
	) => () => void;
}
