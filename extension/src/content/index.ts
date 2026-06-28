import { ChromeStorageDuelsStateStore } from "@/content/features/duels/chromeStorageDuelsStateStore";
import { createDuelsEngine } from "@/content/features/duels/factory/duelsEngineFactory";

const engine = createDuelsEngine();
const store = new ChromeStorageDuelsStateStore();

/**
 * Извиква се при зареждане на content script-а (всяка страница).
 *
 * 1. Проверява дали агентът трябва да работи и какви са настройките
 * 2. Ако да — изпълнява една стъпка от DomDuelsEngine
 * 3. Записва резултата обратно в storage
 *
 * Ако стъпката доведе до навигация — този content script ще умре
 * и новата страница ще извика runAgentStep отново.
 */
export async function runAgentStep(): Promise<void> {
	const running = await store.isRunning();
	if (!running) return;

	const settings = await store.getSettings();
	if (!settings) {
		await store.reportProgress({
			status: "error",
			errorMessage: "Няма зададени настройки.",
		});
		return;
	}

	try {
		const result = await engine.runStep(settings);

		switch (result.action) {
			case "attacked":
				await store.reportProgress({
					lastAttackAt: new Date().toISOString(),
					attacksToday: (await getAttacksToday()) + 1,
				});
				break;

			case "skipped":
			case "navigated":
				// нищо допълнително за докладване — следващата стъпка ще се
				// изпълни автоматично след зареждането на новата страница
				break;

			case "waiting":
				// изчакваме преди следваща проверка — content script не умира
				// тук, защото не сме навигирали; нужен е setTimeout retry
				if (result.waitMs) {
					setTimeout(() => void runAgentStep(), result.waitMs);
				}
				break;

			case "done":
				await store.reportProgress({ status: "idle" });
				break;
		}
	} catch (err) {
		await store.reportProgress({
			status: "error",
			errorMessage: err instanceof Error ? err.message : String(err),
		});
	}
}

// ─── Helper ────────────────────────────────────────────────────────────────────

async function getAttacksToday(): Promise<number> {
	const state = await store.getState();
	return state.attacksToday ?? 0;
}
