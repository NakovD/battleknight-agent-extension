/**
 * Handles the runtime messages one feature owns.
 *
 * Returns the reply for a message it owns — including a failed request, which should
 * still be answered — or null so the next feature's handler can try it.
 *
 * sender says who asked: a content script's message carries its tab, which is
 * how a game tab learns its own id.
 */
export type MessageHandler = (
	raw: unknown,
	sender?: chrome.runtime.MessageSender,
) => Promise<unknown> | null;
