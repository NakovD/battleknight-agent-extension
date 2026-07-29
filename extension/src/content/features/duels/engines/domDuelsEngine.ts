import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import { domDuelsEngineConstants } from "@/content/features/duels/constants/domDuelsEngineConstants";
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

		switch (page) {
			case "ranking-unfiltered":
				return this.handleRankingUnfiltered(settings);

			case "ranking-ready":
				return this.handleRankingReady(settings, context);

			case "duel-result":
				return this.handleDuelResult(settings, context);

			case "unknown":
			default:
				navigateTo(domDuelsEngineConstants.rankingUrl);
				return { action: "navigated" };
		}
	}

	// ── ranking-unfiltered: submit формата с правилен offset + сортиране ─────

	private handleRankingUnfiltered(
		settings: DuelsSettings,
	): IDuelsEngineStepResult {
		const offsetSelect =
			document.querySelector<HTMLSelectElement>("#highscoreOffset");
		const sortButton = document.querySelector<HTMLElement>("#tooltipLevel a");

		if (!offsetSelect || !sortButton) {
			return { action: "waiting", waitMs: 5_000 };
		}

		offsetSelect.value = String(settings.rankingOffset);
		sortButton.click();

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

		const enemyId = extractEnemyId(target.profileUrl);
		if (!enemyId) {
			return { action: "done" };
		}

		navigateTo(`${domDuelsEngineConstants.duelUrl}${enemyId}`);
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
	const allRows = document.querySelectorAll<HTMLElement>(
		"#highscoreTable tbody tr",
	);
	const knightRows = Array.from(allRows).slice(2);

	const knights: ScrapedKnight[] = [];
	knightRows.forEach((row) => {
		const knight = parseKnightRow(row);
		if (knight) knights.push(knight);
	});

	return knights;
}

function parseKnightRow(row: HTMLElement): ScrapedKnight | null {
	const playerTd = row.querySelector<HTMLElement>("td.playerName");
	if (!playerTd) return null;

	const profileAnchor =
		playerTd.querySelector<HTMLAnchorElement>("a#playerLink");
	if (!profileAnchor) return null;

	const profileUrl = profileAnchor.href;
	const name = (profileAnchor.textContent ?? "").trim();

	const enemyId = extractEnemyId(profileUrl);
	if (!enemyId) return null;

	// Орден — втори <a> в playerTd без id="playerLink"
	const allAnchors = playerTd.querySelectorAll<HTMLAnchorElement>("a");
	const orderAnchor = Array.from(allAnchors).find((a) => a.id !== "playerLink");
	const order = orderAnchor?.textContent?.trim() || null;

	const levelText =
		row.querySelector<HTMLElement>("td.highscore05")?.textContent?.trim() ?? "0";
	const level = parseInt(levelText.replace(/\D/g, ""), 10) || 0;

	const lootText =
		row.querySelector<HTMLElement>("td.highscore06")?.textContent?.trim() ?? "0";
	const loot = parseInt(lootText.replace(/\D/g, ""), 10) || 0;

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
