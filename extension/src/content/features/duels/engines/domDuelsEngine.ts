import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import {
	domDuelsEngineConstants,
	profileLinkSelector,
	rankingTableColumns,
} from "@/content/features/duels/constants/domDuelsEngineConstants";
import type {
	IDuelsEngine,
	IDuelsStepContext,
} from "@/content/features/duels/models/duelsEngine";
import type { IDuelsEngineStepResult } from "@/content/features/duels/models/duelsEngineStepResult";

// ─── Engine ───────────────────────────────────────────────────────────────────

export class DomDuelsEngine implements IDuelsEngine {
	async runStep(
		settings: DuelsSettings,
		context: IDuelsStepContext,
	): Promise<IDuelsEngineStepResult> {
		const page = detectPage(settings);

		console.log("[DomDuelsEngine] page:", page, {
			pathname: window.location.pathname,
			offsetSelectValue: document.querySelector<HTMLSelectElement>(
				"#highscoreOffset",
			)?.value,
			rankingOffset: settings.rankingOffset,
		});

		switch (page) {
			case "ranking-unfiltered":
				return this.handleRankingUnfiltered(settings);

			case "ranking-ready":
				return this.handleRankingReady(settings, context);

			case "duel-result":
				return this.handleDuelResult(settings, context);

			default:
				navigateTo(domDuelsEngineConstants.rankingUrl);
				return { action: "navigated" };
		}
	}

	// ── ranking-unfiltered: смени offset-а на класацията ─────────────────────

	private handleRankingUnfiltered(
		settings: DuelsSettings,
	): IDuelsEngineStepResult {
		const offsetSelect =
			document.querySelector<HTMLSelectElement>("#highscoreOffset");

		if (!offsetSelect) {
			return { action: "waiting", waitMs: 5_000 };
		}

		offsetSelect.value = String(settings.rankingOffset);
		// Задаването на .value не пуска `change` event само по себе си —
		// сайтът има onchange handler на селекта, който сам презарежда
		// страницата с новия offset. Допълнителен click върху друг елемент
		// тук само надбягва/чупи тази навигация.
		offsetSelect.dispatchEvent(new Event("change", { bubbles: true }));

		return { action: "navigated" };
	}

	// ── ranking-ready: провери cooldown → scrape → филтрирай → атакувай ──────

	private handleRankingReady(
		settings: DuelsSettings,
		context: IDuelsStepContext,
	): IDuelsEngineStepResult {
		// Cooldown все още не е изтекъл
		if (context.waitUntil && Date.now() < context.waitUntil) {
			return {
				action: "waiting",
				waitMs: context.waitUntil - Date.now(),
			};
		}

		const knights = scrapeKnights();
		const target = findFirstValidTarget(knights, settings);

		if (!target) {
			return { action: "done" };
		}

		// parseKnightRow already dropped any row whose profile link had no id.
		navigateTo(`${domDuelsEngineConstants.duelUrl}${target.id}`);
		return { action: "navigated", knightId: target.id, enemyName: target.name };
	}

	// ── duel-result: провери резултат → навигирай обратно ────────────────────

	private handleDuelResult(
		settings: DuelsSettings,
		context: IDuelsStepContext,
	): IDuelsEngineStepResult {
		const won = readDuelResult(context.currentEnemyName ?? undefined);

		navigateTo(domDuelsEngineConstants.rankingUrl);

		return {
			action: "attacked",
			won,
			waitMs: settings.cooldownMs,
		};
	}
}

// ─── Разпознаване на страницата ───────────────────────────────────────────────

type PageKind =
	| "ranking-unfiltered"
	| "ranking-ready"
	| "duel-result"
	| "unknown";

function detectPage(settings: DuelsSettings): PageKind {
	const path = window.location.pathname;

	if (path.includes("/duel/duel")) return "duel-result";

	if (path.includes("/highscore")) {
		const offsetSelect =
			document.querySelector<HTMLSelectElement>("#highscoreOffset");

		if (
			!offsetSelect ||
			offsetSelect.value !== String(settings.rankingOffset)
		) {
			return "ranking-unfiltered";
		}

		return "ranking-ready";
	}

	return "unknown";
}

// ─── Scraping ─────────────────────────────────────────────────────────────────

interface ScrapedKnight {
	id: string;
	name: string;
	level: number;
	loot: number;
	order: string | null;
	profileUrl: string;
}

function scrapeKnights(): ScrapedKnight[] {
	const rows = document.querySelectorAll<HTMLElement>(
		"#highscoreTable tbody tr",
	);

	// Header and spacer rows are recognised by having no player link rather than by
	// position: the ranking doesn't always put the same number of them first, and
	// skipping a fixed two dropped real knights on pages that had fewer.
	const knights: ScrapedKnight[] = [];
	rows.forEach((row) => {
		const knight = parseKnightRow(row);
		if (knight) knights.push(knight);
	});

	return knights;
}

const parseNumericCell = (row: HTMLElement, selector: string) => {
	const text = row.querySelector<HTMLElement>(selector)?.textContent?.trim() ?? "0";

	// Thousand separators and any stray markup around the number.
	return parseInt(text.replace(/\D/g, ""), 10) || 0;
};

function parseKnightRow(row: HTMLElement): ScrapedKnight | null {
	const playerTd = row.querySelector<HTMLElement>(
		rankingTableColumns.playerName,
	);
	if (!playerTd) return null;

	const profileAnchor =
		playerTd.querySelector<HTMLAnchorElement>(profileLinkSelector);
	if (!profileAnchor) return null;

	const profileUrl = profileAnchor.href;
	const name = (profileAnchor.textContent ?? "").trim();

	const enemyId = extractEnemyId(profileUrl);
	if (!enemyId) return null;

	// Орден — всеки друг <a> в клетката с името
	const allAnchors = playerTd.querySelectorAll<HTMLAnchorElement>("a");
	const orderAnchor = Array.from(allAnchors).find(
		(anchor) => anchor !== profileAnchor,
	);
	const order = orderAnchor?.textContent?.trim() || null;

	const level = parseNumericCell(row, rankingTableColumns.level);
	const loot = parseNumericCell(row, rankingTableColumns.loot);

	return { id: enemyId, name, level, loot, order, profileUrl };
}

// ─── Филтриране ───────────────────────────────────────────────────────────────

function findFirstValidTarget(
	knights: ScrapedKnight[],
	settings: DuelsSettings,
): ScrapedKnight | null {
	return (
		knights.find((k) => {
			if (k.level < settings.levelMin || k.level > settings.levelMax)
				return false;
			if (settings.lootFilterEnabled && k.loot > settings.lootMax) return false;

			if (settings.skipAllOrders && k.order !== null) {
				if (!settings.skipSpecificOrders) return false;
				if (settings.ordersToSkip.includes(k.order)) return false;
			}

			return true;
		}) ?? null
	);
}

// ─── Резултат от дуел ─────────────────────────────────────────────────────────

/**
 * Чете победителя от h1 em в #fightResultContainer.
 * Ако enemyName е в текста → противникът е победил → загуба.
 * Ако не → потребителят е победил.
 */
function readDuelResult(enemyName?: string): boolean {
	const resultEl = document.querySelector<HTMLElement>(
		"#fightResultContainer .fightResultsInner h1 em",
	);

	if (!resultEl || !enemyName) return false;

	return !(resultEl.textContent ?? "").trim().includes(enemyName);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Извлича enemyID от URL:
 * https://s26-bg.battleknight.gameforge.com:443/common/profile/344255/Scores/Player
 *                                                               ^^^^^^
 */
function extractEnemyId(profileUrl: string): string | null {
	const match = profileUrl.match(/\/profile\/(\d+)\//);
	return match?.[1] ?? null;
}

function navigateTo(path: string): void {
	window.location.href = path;
}
