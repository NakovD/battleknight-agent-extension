import { ChromeStorageDuelsStateStore } from "@/content/features/duels/chromeStorageDuelsStateStore";
import { createDuelsEngine } from "@/content/features/duels/factory/duelsEngineFactory";
import type { IDuelsStepContext } from "@/content/features/duels/models/duelsEngine";

const engine = createDuelsEngine("dom");
const store = new ChromeStorageDuelsStateStore();

/**
 * Circuit breaker: ако имаме толкова последователни навигации без нито
 * една успешна атака или "done" междувременно, приемаме че сме влезли
 * в loop (напр. счупена навигация в играта) и спираме агента сами,
 * вместо да разчитаме потребителят да успее да натисне Stop навреме.
 */
const MAX_CONSECUTIVE_NAVIGATIONS = 8;

/**
 * Колко отказани рицаря помним. Държи списъка кратък — стари откази губят
 * смисъл (играта може вече да допуска дуел с тях).
 */
const MAX_REFUSED_ENEMIES = 20;

/**
 * Извиква се при зареждане на content script-а (всяка страница).
 *
 * 1. Проверява дали агентът трябва да работи и какви са настройките
 * 2. Изгражда контекст от текущото state
 * 3. Изпълнява една стъпка от DomDuelsEngine
 * 4. Записва резултата обратно в storage
 */
export const runAgentStep = async (): Promise<void> => {
	const running = await store.isRunning();
	if (!running) return;

	const state = await store.getState();

	if (!state.settings) {
		await store.reportProgress({
			status: "error",
			errorMessage: "Agent is running but settings are missing",
		});
		return;
	}

	const context: IDuelsStepContext = {
		waitUntil: state.waitUntil,
		currentEnemyName: state.currentEnemyName,
		refusedEnemyIds: state.refusedEnemyIds ?? [],
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
					currentEnemyId: null,
					consecutiveNavigations: 0,
				});
				break;

			case "refused": {
				// Играта отказа дуела. Чакаме cooldown-а и повече не пробваме този
				// рицар, иначе следващата стъпка избира същия и се върти в кръг.
				const refusedEnemyIds = state.currentEnemyId
					? [
							...(state.refusedEnemyIds ?? []).filter(
								(id) => id !== state.currentEnemyId,
							),
							state.currentEnemyId,
						].slice(-MAX_REFUSED_ENEMIES)
					: (state.refusedEnemyIds ?? []);

				// waitUntil нарочно се оставя както е: отказът не струва нищо, така че
				// следващият рицар може да се пробва веднага, но cooldown-ът от
				// последния истински дуел трябва да си изтече.
				//
				// consecutiveNavigations също не се нулира: отказът не е успех, и низ
				// от откази трябва да стигне до circuit breaker-а.
				await store.reportProgress({
					refusedEnemyIds,
					errorMessage: result.reason ?? null,
					currentEnemyName: null,
					currentEnemyId: null,
				});
				break;
			}

			case "navigated": {
				const consecutiveNavigations = state.consecutiveNavigations + 1;

				if (consecutiveNavigations >= MAX_CONSECUTIVE_NAVIGATIONS) {
					await store.reportProgress({
						status: "error",
						errorMessage: `Агентът спря автоматично след ${consecutiveNavigations} последователни навигации без успешна атака — вероятно е засечен loop.`,
						consecutiveNavigations: 0,
						currentEnemyName: null,
						currentEnemyId: null,
						waitUntil: null,
					});
					break;
				}

				// Ако навигираме към дуел — запазваме кого атакуваме, за да знаем
				// кой е отказан, ако играта ни прати на error страницата.
				await store.reportProgress({
					consecutiveNavigations,
					...(result.enemyName ? { currentEnemyName: result.enemyName } : {}),
					...(result.knightId ? { currentEnemyId: result.knightId } : {}),
				});
				// Content script-ът ще умре при навигация —
				// новата страница ще извика runAgentStep отново
				break;
			}

			case "waiting":
				// Не навигираме — retry след изчакване
				if (result.waitMs) {
					setTimeout(() => void runAgentStep(), result.waitMs);
				}
				break;

			case "done":
				await store.reportProgress({
					status: "idle",
					// Носи се до popup-а, за да се вижда защо агентът е спрял.
					errorMessage: result.reason ?? null,
					waitUntil: null,
					currentEnemyName: null,
					currentEnemyId: null,
					consecutiveNavigations: 0,
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
};
