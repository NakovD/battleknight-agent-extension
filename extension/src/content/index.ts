import { ChromeStorageDuelsStateStore } from "@/content/features/duels/chromeStorageDuelsStateStore";
import { createDuelsEngine } from "@/content/features/duels/factory/duelsEngineFactory";
import type { IDuelsStepContext } from "@/content/features/duels/models/duelsEngine";

const engine = createDuelsEngine("dom");
const store = new ChromeStorageDuelsStateStore();

/**
 * Извиква се при зареждане на content script-а (всяка страница).
 *
 * 1. Проверява дали агентът трябва да работи и какви са настройките
 * 2. Изгражда контекст от текущото state
 * 3. Изпълнява една стъпка от DomDuelsEngine
 * 4. Записва резултата обратно в storage
 */
export async function runAgentStep(): Promise<void> {
	const running = await store.isRunning();
	if (!running) return;

	const state = await store.getState();

	if (!state.settings) {
		await store.reportProgress({
			status: "error",
			errorMessage: "Няма зададени настройки.",
		});
		return;
	}

	const context: IDuelsStepContext = {
		waitUntil: state.waitUntil,
		currentEnemyName: state.currentEnemyName,
	};

	try {
		const result = await engine.runStep(state.settings, context);

		switch (result.action) {
			case "attacked":
				await store.reportProgress({
					attacksToday: state.attacksToday + 1,
					lastAttackAt: new Date().toISOString(),
					waitUntil: result.waitMs ? Date.now() + result.waitMs : null,
					currentEnemyName: null,
				});
				break;

			case "navigated":
				// Ако навигираме към дуел — запазваме името на противника
				if (result.enemyName) {
					await store.reportProgress({ currentEnemyName: result.enemyName });
				}
				// Content script-ът ще умре при навигация —
				// новата страница ще извика runAgentStep отново
				break;

			case "waiting":
				// Не навигираме — retry след изчакване
				if (result.waitMs) {
					setTimeout(() => void runAgentStep(), result.waitMs);
				}
				break;

			case "done":
				await store.reportProgress({
					status: "idle",
					waitUntil: null,
					currentEnemyName: null,
				});
				break;

			case "skipped":
				// Нищо — следващата стъпка ще се изпълни при следващото зареждане
				break;
		}
	} catch (err) {
		await store.reportProgress({
			status: "error",
			errorMessage: err instanceof Error ? err.message : String(err),
			currentEnemyName: null,
			waitUntil: null,
		});
	}
}
