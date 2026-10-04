/**
 * Handles the runtime messages one feature owns.
 *
 * Returns the reply for a message it owns — including a failed request, which should
 * still be answered — or null so the next feature's handler can try it.
 */
export type MessageHandler = (raw: unknown) => Promise<unknown> | null;
