import { vi } from "vitest";

type StorageChangeListener = (
	changes: Record<string, chrome.storage.StorageChange>,
	areaName: string,
) => void;

/**
 * Минимален in-memory mock на chrome.storage.local за тестове.
 *
 * `set()` НЕ пуска автоматично onChanged listener-ите — целта е тестовете
 * да контролират изрично кога симулират "външна" промяна (напр. content
 * script-ът пише директно в storage) чрез dispatchChange(), вместо всеки
 * write() сам да си echo-ва собствената промяна.
 */
export function installChromeStorageMock() {
	const store: Record<string, unknown> = {};
	const changeListeners = new Set<StorageChangeListener>();

	const chromeMock = {
		storage: {
			local: {
				get: vi.fn(
					(key: string, callback: (result: Record<string, unknown>) => void) => {
						callback(key in store ? { [key]: store[key] } : {});
					},
				),
				set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
					Object.assign(store, items);
					callback?.();
				}),
			},
			onChanged: {
				addListener: vi.fn((listener: StorageChangeListener) => {
					changeListeners.add(listener);
				}),
				removeListener: vi.fn((listener: StorageChangeListener) => {
					changeListeners.delete(listener);
				}),
			},
		},
	};

	globalThis.chrome = chromeMock as unknown as typeof chrome;

	const dispatchChange = (
		key: string,
		newValue: unknown,
		areaName = "local",
	) => {
		changeListeners.forEach((listener) =>
			listener({ [key]: { newValue } as chrome.storage.StorageChange }, areaName),
		);
	};

	return { store, dispatchChange };
}
