import type { ZodType, infer as ZodInfer } from "zod";

/**
 * Sends a message to the extension's other contexts and validates the reply.
 *
 * Rejects with chrome.runtime.lastError's message when nothing answered (e.g. the
 * background service worker failed to load), or when the reply doesn't match
 * responseValidator.
 */
export const sendRuntimeMessage = <TValidator extends ZodType>(
	message: unknown,
	responseValidator: TValidator,
) =>
	new Promise<ZodInfer<TValidator>>((resolve, reject) => {
		chrome.runtime.sendMessage(message, (raw: unknown) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError.message);
				return;
			}

			const result = responseValidator.safeParse(raw);

			if (!result.success) {
				reject(`Invalid response: ${result.error.message}`);
				return;
			}

			resolve(result.data as ZodInfer<TValidator>);
		});
	});
