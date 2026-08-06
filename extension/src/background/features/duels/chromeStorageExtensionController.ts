import type { IDuelsExtensionController } from "@/background/features/duels/models/duelsExtensionController.ts ";
import {
	DUELS_INITIAL_EXTENSION_STATE,
	DUELS_STORAGE_KEY,
} from "@/common/features/duels/constants/duelsStateConstants";
import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";

type ControllerState = DuelsExtensionState;

/**
 * Пази състоянието на агента в chrome.storage.local.
 * Уведомява popup-а за промени чрез chrome.runtime съобщения.
 */
export class ChromeStorageAgentController implements IDuelsExtensionController {
	private listeners = new Set<(state: ControllerState) => void>();

	constructor() {
		// Следи за промени, направени директно в storage
		// (напр. от content script-а, който пише там директно)
		chrome.storage.onChanged.addListener((changes, areaName) => {
			if (areaName !== "local") return;
			if (!(DUELS_STORAGE_KEY in changes)) return;

			const newState = changes[DUELS_STORAGE_KEY].newValue as
				| ControllerState
				| undefined;
			if (newState) this.notify(newState);
		});
	}

	// ── Публични методи ──────────────────────────────────────────────────────

	async start(settings: DuelsSettings): Promise<void> {
		const current = await this.read();
		const next: ControllerState = {
			...current,
			status: "running",
			errorMessage: null,
			settings,
			consecutiveNavigations: 0,
		};
		await this.write(next);
	}

	async stop(): Promise<void> {
		const current = await this.read();
		const next: ControllerState = {
			...current,
			status: "idle",
			errorMessage: null,
		};
		await this.write(next);
	}

	async getStatus(): Promise<ControllerState> {
		return this.read();
	}

	async updateStatus(
		patch: Partial<ControllerState>,
	): Promise<ControllerState> {
		const current = await this.read();
		const next: ControllerState = { ...current, ...patch };
		await this.write(next);
		return next;
	}

	onStatusChange(handler: (state: ControllerState) => void): () => void {
		this.listeners.add(handler);
		return () => this.listeners.delete(handler);
	}

	// ── Private helpers ──────────────────────────────────────────────────────

	private read(): Promise<ControllerState> {
		return new Promise((resolve) => {
			chrome.storage.local.get(DUELS_STORAGE_KEY, (result) => {
				resolve(
					(result[DUELS_STORAGE_KEY] as ControllerState) ??
						DUELS_INITIAL_EXTENSION_STATE,
				);
			});
		});
	}

	private write(state: ControllerState): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.set({ [DUELS_STORAGE_KEY]: state }, () => {
				this.notify(state);
				resolve();
			});
		});
	}

	private notify(state: ControllerState): void {
		this.listeners.forEach((handler) => {
			handler(state);
		});
	}
}
