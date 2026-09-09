import { vi } from "vitest";

type MessageListener = (raw: unknown) => void;

/**
 * Минимален mock на chrome.runtime за тестове на extensionMessenger.
 *
 * sendMessage връща каквото е зададено през setNextResponse(); ако е
 * зададена грешка през setLastError(), chrome.runtime.lastError се
 * "вдига" точно преди callback-а — както прави реалният браузър, когато
 * няма слушащ receiver.
 */
export function installChromeRuntimeMock() {
	const messageListeners = new Set<MessageListener>();
	let lastErrorMessage: string | undefined;
	let nextResponse: unknown;

	const sendMessage = vi.fn(
		(_msg: unknown, callback: (response: unknown) => void) => {
			callback(nextResponse);
		},
	);

	const chromeMock = {
		runtime: {
			sendMessage,
			onMessage: {
				addListener: vi.fn((listener: MessageListener) => {
					messageListeners.add(listener);
				}),
				removeListener: vi.fn((listener: MessageListener) => {
					messageListeners.delete(listener);
				}),
			},
			get lastError() {
				return lastErrorMessage ? { message: lastErrorMessage } : undefined;
			},
		},
	};

	globalThis.chrome = chromeMock as unknown as typeof chrome;

	return {
		sendMessage,
		setNextResponse: (response: unknown) => {
			nextResponse = response;
		},
		setLastError: (message: string | undefined) => {
			lastErrorMessage = message;
		},
		dispatchMessage: (raw: unknown) => {
			messageListeners.forEach((listener) => listener(raw));
		},
		listenerCount: () => messageListeners.size,
	};
}
