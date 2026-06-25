import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import type { IDuelsEngine } from "@/content/features/duels/models/duelsEngine";
import type { IDuelsEngineStepResult } from "@/content/features/duels/models/duelsEngineStepResult";

const DEFAULT_COOLDOWN_MS = 30_000;
const NO_TARGETS_WAIT_MS = 60_000;

/**
 * DOM-базирана имплементация — чете класацията и атакува чрез DOM селектори.
 *
 * Чиста: не пипа chrome.storage, не управлява loop-ове или сесии.
 * Извиква се при всяко зареждане на content script-а, връща резултат,
 * extension/content/index.ts решава какво да прави с него.
 */
export class DomDuelsEngine implements IDuelsEngine {
	async runStep(settings: DuelsSettings): Promise<IDuelsEngineStepResult> {
		const page = detectPage();

		switch (page) {
			case "ranking":
				return this.handleRankingPage(settings);

			case "duel-result":
				return this.handleDuelResultPage();

			case "unknown":
			default:
				// Неразпозната страница — навигирай към класацията
				navigateToRanking();
				return { action: "navigated" };
		}
	}

	// ── Страница: класация ────────────────────────────────────────────────────

	private async handleRankingPage(
		settings: DuelsSettings,
	): Promise<IDuelsEngineStepResult> {
		const knights = scrapeKnights();
		const target = findFirstValidTarget(knights, settings);

		if (!target) {
			return { action: "waiting", waitMs: NO_TARGETS_WAIT_MS };
		}

		// Навигира към страницата за атака — текущият content script ще умре тук
		navigateToAttack(target.attackUrl);
		return { action: "navigated", knightId: target.id };
	}

	// ── Страница: резултат от дуел ────────────────────────────────────────────

	private async handleDuelResultPage(): Promise<IDuelsEngineStepResult> {
		const cooldownMs = readCooldownTimer();
		navigateToRanking();
		return { action: "attacked", waitMs: cooldownMs ?? DEFAULT_COOLDOWN_MS };
	}
}

// ─── Разпознаване на страницата ────────────────────────────────────────────────

type PageKind = "ranking" | "duel-result" | "unknown";

function detectPage(): PageKind {
	// TODO: попълни след инспекция на реалните URL-и / DOM маркери
	if (window.location.href.includes("ranking")) return "ranking";
	if (document.querySelector(".duel-result, [data-duel-result]"))
		return "duel-result";
	return "unknown";
}

// ─── Scraping ──────────────────────────────────────────────────────────────────

interface ScrapedKnight {
	id: string;
	name: string;
	level: number;
	loot: number;
	order: string | null;
	attackUrl: string;
}

function scrapeKnights(): ScrapedKnight[] {
	const rows = document.querySelectorAll<HTMLElement>(
		"[data-knight-row], .ranking-row, tr.knight",
	);

	const knights: ScrapedKnight[] = [];
	rows.forEach((row) => {
		const knight = parseKnightRow(row);
		if (knight) knights.push(knight);
	});
	return knights;
}

function parseKnightRow(row: HTMLElement): ScrapedKnight | null {
	const id =
		row.dataset.knightId ??
		row.dataset.id ??
		row.querySelector<HTMLElement>("[data-id]")?.dataset.id;
	if (!id) return null;

	const name =
		row
			.querySelector<HTMLElement>(".knight-name, [data-name], .name")
			?.innerText.trim() ?? "";

	const levelText =
		row
			.querySelector<HTMLElement>(".knight-level, [data-level], .level")
			?.innerText.trim() ?? "0";
	const level = parseInt(levelText.replace(/\D/g, ""), 10) || 0;

	const lootText =
		row
			.querySelector<HTMLElement>(".loot, [data-loot], .silver, .prize")
			?.innerText.trim() ?? "0";
	const loot = parseInt(lootText.replace(/\D/g, ""), 10) || 0;

	const order =
		row
			.querySelector<HTMLElement>(".order-name, [data-order], .guild")
			?.innerText.trim() || null;

	const attackAnchor = row.querySelector<HTMLAnchorElement>(
		"a.attack, a[href*='attack'], a[href*='duel'], button[data-attack]",
	);
	const attackUrl = attackAnchor?.href ?? "";
	if (!attackUrl) return null;

	return { id, name, level, loot, order, attackUrl };
}

// ─── Филтриране ──────────────────────────────────────────────────────────────

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

// ─── Навигация ──────────────────────────────────────────────────────────────────

function navigateToRanking(): void {
	// TODO: попълни реалния URL
	window.location.href = "/ranking";
}

function navigateToAttack(attackUrl: string): void {
	window.location.href = attackUrl;
}

// ─── Cooldown ──────────────────────────────────────────────────────────────────

function readCooldownTimer(): number | null {
	const timerEl = document.querySelector<HTMLElement>(
		"#duel_timer, .cooldown-timer, [data-cooldown], .next-duel-time",
	);
	if (!timerEl) return null;

	const text = timerEl.innerText.trim();

	const mmss = text.match(/(\d+):(\d+)/);
	if (mmss) {
		const minutes = parseInt(mmss[1], 10);
		const seconds = parseInt(mmss[2], 10);
		return (minutes * 60 + seconds) * 1_000 + 1_000;
	}

	const sec = parseInt(text.replace(/\D/g, ""), 10);
	if (!isNaN(sec) && sec > 0) return sec * 1_000 + 1_000;

	return null;
}
