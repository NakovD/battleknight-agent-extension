import { duelsConstants } from "@/background/features/duels/constant/duelsConstants";
import type { IDuelsExtensionController } from "@/background/features/duels/models/duelsExtensionController.ts ";
import type { DuelsExtensionState } from "@/common/features/duels/models/duelsExtensionState";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";

type ControllerState = DuelsExtensionState;

const INITIAL_STATE: ControllerState = {
	status: "idle",
	errorMessage: null,
	settings: null,
};

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
			if (!(duelsConstants.storageKey in changes)) return;

			const newState = changes[duelsConstants.storageKey].newValue as
				| ControllerState
				| undefined;
			if (newState) this.notify(newState);
		});
	}

	// ── Публични методи ──────────────────────────────────────────────────────

	async start(settings: DuelsSettings): Promise<void> {
		const next: ControllerState = {
			status: "running",
			errorMessage: null,
			settings,
		};
		await this.write(next);
	}

	async stop(): Promise<void> {
		const current = await this.read();
		const next: ControllerState = {
			status: "idle",
			errorMessage: null,
			settings: current.settings,
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
			chrome.storage.local.get(duelsConstants.storageKey, (result) => {
				resolve(
					(result[duelsConstants.storageKey] as ControllerState) ??
						INITIAL_STATE,
				);
			});
		});
	}

	private write(state: ControllerState): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.set({ [duelsConstants.storageKey]: state }, () => {
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
