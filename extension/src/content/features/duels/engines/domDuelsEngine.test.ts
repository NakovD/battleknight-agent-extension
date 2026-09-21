import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import type { IDuelsStepContext } from "@/content/features/duels/models/duelsEngine";
import { DomDuelsEngine } from "./domDuelsEngine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultSettings: DuelsSettings = {
	levelMin: 5,
	levelMax: 15,
	lootFilterEnabled: true,
	lootMax: 2000,
	skipAllOrders: false,
	skipSpecificOrders: false,
	ordersToSkip: [],
	rankingOffset: 0,
	cooldownMs: 120_000,
};

const defaultContext: IDuelsStepContext = {
	waitUntil: null,
	currentEnemyName: null,
};

function setPathname(path: string) {
	Object.defineProperty(window, "location", {
		value: { pathname: path, href: "" },
		writable: true,
	});
}

/**
 * Изгражда минимален DOM за ranking страница с подадените рицари.
 */
function buildRankingDOM(
	offset: string,
	knights: {
		name: string;
		level: number;
		loot: number;
		profileUrl: string;
		order?: string;
	}[],
) {
	document.body.innerHTML = `
    <select id="highscoreOffset">
      <option value="0">1-100</option>
      <option value="100">101-200</option>
    </select>
    <div id="tooltipLevel"><a href="#">Ниво</a></div>
    <table id="highscoreTable">
      <tbody>
        <tr><td>header 1</td></tr>
        <tr><td>header 2</td></tr>
        ${knights
					.map(
						// Mirrors a live ranking row: rank, icon, name, level, loot, then
						// fights/wins/losses. Levels used to be read from the column after
						// the right one, which no test caught because this helper had the
						// same layout as the code.
						(k, index) => `
          <tr>
            <td class="highscore01">${1401 + index}</td>
            <td class="highscore02"></td>
            <td class="highscore03 playerName">
              <a id="playerLink" href="${k.profileUrl}">${k.name}</a>
              ${k.order ? `<a href="/order/1">${k.order}</a>` : ""}
            </td>
            <td class="highscore04">${k.level}</td>
            <td class="highscore05">${k.loot}</td>
            <td class="highscore06">236</td>
            <td class="highscore07">235</td>
            <td class="highscore08">1</td>
          </tr>
        `,
					)
					.join("")}
      </tbody>
    </table>
  `;

	const select = document.querySelector<HTMLSelectElement>("#highscoreOffset")!;
	select.value = offset;
}

function buildDuelResultDOM(winnerName: string) {
	document.body.innerHTML = `
    <div id="fightResultContainer">
      <div class="fightResultsInner">
        <h1><em>${winnerName} победи</em></h1>
      </div>
    </div>
  `;
}

// ─── Тестове ──────────────────────────────────────────────────────────────────

describe("DomDuelsEngine", () => {
	let engine: DomDuelsEngine;

	beforeEach(() => {
		engine = new DomDuelsEngine();
		document.body.innerHTML = "";
		vi.restoreAllMocks();
	});

	// ── detectPage ────────────────────────────────────────────────────────────

	describe("detectPage → ranking-unfiltered", () => {
		it("връща ranking-unfiltered ако офсетът не съвпада с настройките", async () => {
			setPathname("/highscore/");
			buildRankingDOM("100", []); // offset е 100, settings иска 0

			const result = await engine.runStep(defaultSettings, defaultContext);

			// При ranking-unfiltered сменя offset-а и връща navigated
			expect(result.action).toBe("navigated");
		});

		it("връща waiting ако липсва #highscoreOffset", async () => {
			setPathname("/highscore/");
			document.body.innerHTML = ""; // празен DOM

			const result = await engine.runStep(defaultSettings, defaultContext);

			expect(result.action).toBe("waiting");
			expect(result.waitMs).toBe(5_000);
		});
	});

	describe("detectPage → ranking-ready", () => {
		it("разпознава ranking-ready ако офсетът съвпада", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Target Knight",
					level: 10,
					loot: 500,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/999/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, defaultContext);

			expect(result.action).toBe("navigated");
			expect(result.knightId).toBe("999");
			expect(result.enemyName).toBe("Target Knight");
		});
	});

	describe("detectPage → duel-result", () => {
		it("разпознава duel-result страницата", async () => {
			setPathname("/duel/duel/");
			buildDuelResultDOM("Enemy Knight");

			const result = await engine.runStep(defaultSettings, {
				...defaultContext,
				currentEnemyName: "Enemy Knight",
			});

			expect(result.action).toBe("attacked");
		});
	});

	describe("detectPage → unknown", () => {
		it("навигира към /highscore/ при непозната страница", async () => {
			setPathname("/some/unknown/page");
			const navigateSpy = vi.spyOn(window.location, "href", "set");

			const result = await engine.runStep(defaultSettings, defaultContext);

			expect(result.action).toBe("navigated");
			expect(navigateSpy).toHaveBeenCalledWith("/highscore/");
		});
	});

	// ── handleRankingUnfiltered ───────────────────────────────────────────────

	describe("handleRankingUnfiltered", () => {
		it("задава правилния offset и пуска change event", async () => {
			setPathname("/highscore/");
			buildRankingDOM("100", []); // грешен offset

			const select =
				document.querySelector<HTMLSelectElement>("#highscoreOffset")!;
			const changeHandler = vi.fn();
			select.addEventListener("change", changeHandler);

			const result = await engine.runStep(
				{ ...defaultSettings, rankingOffset: 0 },
				defaultContext,
			);

			expect(select.value).toBe("0");
			expect(changeHandler).toHaveBeenCalledOnce();
			expect(result.action).toBe("navigated");
		});
	});

	// ── handleRankingReady ────────────────────────────────────────────────────

	describe("handleRankingReady — cooldown", () => {
		it("връща waiting ако waitUntil не е изтекъл", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", []);

			const waitUntil = Date.now() + 60_000;
			const result = await engine.runStep(defaultSettings, {
				...defaultContext,
				waitUntil,
			});

			expect(result.action).toBe("waiting");
			expect(result.waitMs).toBeGreaterThan(0);
			expect(result.waitMs).toBeLessThanOrEqual(60_000);
		});

		it("продължава нормално ако waitUntil е изтекъл", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Knight",
					level: 10,
					loot: 500,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/123/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, {
				...defaultContext,
				waitUntil: Date.now() - 1_000, // вече изтекъл
			});

			expect(result.action).toBe("navigated");
		});
	});

	describe("duel-refused — играта отказа дуела", () => {
		it("разпознава error страницата и се връща към класацията", async () => {
			setPathname("/common/error");

			const navigateSpy = vi.spyOn(window.location, "href", "set");
			const result = await engine.runStep(defaultSettings, {
				...defaultContext,
				currentEnemyName: "Some Knight",
			});

			expect(result.action).toBe("refused");
			// Без ново изчакване — отказът не струва ход, минава се на следващия.
			expect(result.waitMs).toBeUndefined();
			expect(result.reason).toContain("Some Knight");
			expect(navigateSpy).toHaveBeenCalledWith("/highscore/");
		});

		it("не избира рицар, при когото играта вече е отказала дуел", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Refused Knight",
					level: 10,
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/111/Scores/Player",
				},
				{
					name: "Next Knight",
					level: 10,
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/222/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, {
				...defaultContext,
				refusedEnemyIds: ["111"],
			});

			expect(result.action).toBe("navigated");
			expect(result.knightId).toBe("222");
		});
	});

	describe("handleRankingReady — четене на таблицата", () => {
		it("не изпуска рицар, застанал на първия ред", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "First Row Knight",
					level: 10,
					loot: 500,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/777/Scores/Player",
				},
			]);
			// Класацията не винаги слага заглавни редове преди рицарите.
			document.querySelectorAll("#highscoreTable tbody tr").forEach((row) => {
				if (!row.querySelector("a#playerLink")) row.remove();
			});

			const result = await engine.runStep(defaultSettings, defaultContext);

			expect(result.action).toBe("navigated");
			expect(result.knightId).toBe("777");
		});

		it("пропуска заглавни и празни редове, без да ги брои за рицари", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Only Knight",
					level: 99, // над levelMax, за да видим броя в съобщението
					loot: 500,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/778/Scores/Player",
				},
			]);
			document
				.querySelector("#highscoreTable tbody")
				?.insertAdjacentHTML("beforeend", "<tr><td></td></tr>");

			const result = await engine.runStep(defaultSettings, defaultContext);

			expect(result.reason).toContain("None of the 1 knights");
		});
	});

	describe("handleRankingReady — причина за спиране", () => {
		it("обяснява, че никой от рицарите не отговаря на филтрите", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Too High",
					level: 99, // над levelMax: 15
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/1/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, defaultContext);

			expect(result.action).toBe("done");
			expect(result.reason).toContain("matched your filters");
		});

		it("различава празна таблица от липса на подходящи рицари", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", []);

			const result = await engine.runStep(defaultSettings, defaultContext);

			expect(result.action).toBe("done");
			expect(result.reason).toContain("Could not read any knights");
		});

		it("разпознава липсваща таблица", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", []);
			document.querySelector("#highscoreTable")?.remove();

			const result = await engine.runStep(defaultSettings, defaultContext);

			expect(result.action).toBe("done");
			expect(result.reason).toContain("Could not find the ranking table");
		});
	});

	describe("handleRankingReady — филтриране по ниво", () => {
		it("пропуска рицари под минималното ниво", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Too Low",
					level: 3, // под levelMin: 5
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/1/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, defaultContext);
			expect(result.action).toBe("done");
		});

		it("пропуска рицари над максималното ниво", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Too High",
					level: 20, // над levelMax: 15
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/2/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, defaultContext);
			expect(result.action).toBe("done");
		});

		it("атакува рицар в правилния level range", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Valid Knight",
					level: 10,
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/42/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, defaultContext);
			expect(result.action).toBe("navigated");
			expect(result.knightId).toBe("42");
		});
	});

	describe("handleRankingReady — филтриране по плячка", () => {
		it("пропуска рицари с плячка над лимита", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Rich Knight",
					level: 10,
					loot: 5000, // над lootMax: 2000
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/3/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, defaultContext);
			expect(result.action).toBe("done");
		});

		it("не филтрира по плячка ако lootFilterEnabled е false", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Rich Knight",
					level: 10,
					loot: 99999,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/4/Scores/Player",
				},
			]);

			const result = await engine.runStep(
				{ ...defaultSettings, lootFilterEnabled: false },
				defaultContext,
			);
			expect(result.action).toBe("navigated");
		});
	});

	describe("handleRankingReady — филтриране по орден", () => {
		it("пропуска всички рицари с орден ако skipAllOrders е true", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Order Knight",
					level: 10,
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/5/Scores/Player",
					order: "Някакъв орден",
				},
			]);

			const result = await engine.runStep(
				{ ...defaultSettings, skipAllOrders: true },
				defaultContext,
			);
			expect(result.action).toBe("done");
		});

		it("не пропуска рицар без орден дори ако skipAllOrders е true", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Free Knight",
					level: 10,
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/6/Scores/Player",
					// без орден
				},
			]);

			const result = await engine.runStep(
				{ ...defaultSettings, skipAllOrders: true },
				defaultContext,
			);
			expect(result.action).toBe("navigated");
		});

		it("пропуска само конкретни ордени ако skipSpecificOrders е true", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Allowed Order Knight",
					level: 10,
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/7/Scores/Player",
					order: "Приятелски орден",
				},
				{
					name: "Blocked Order Knight",
					level: 10,
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/8/Scores/Player",
					order: "Враждебен орден",
				},
			]);

			const result = await engine.runStep(
				{
					...defaultSettings,
					skipAllOrders: true,
					skipSpecificOrders: true,
					ordersToSkip: ["Враждебен орден"],
				},
				defaultContext,
			);

			// Първият е блокиран (орден, но не в списъка → пропуска се при skipSpecificOrders)
			// Вторият е в списъка → пропуска се
			// Всъщност при skipSpecificOrders: true — пропускаме само ordensToSkip
			expect(result.action).toBe("navigated");
			expect(result.knightId).toBe("7");
		});
	});

	// ── handleDuelResult ──────────────────────────────────────────────────────

	describe("handleDuelResult — победа/загуба", () => {
		it("връща won: true ако потребителят е победил", async () => {
			setPathname("/duel/duel/");
			buildDuelResultDOM("Enemy Knight");

			const result = await engine.runStep(defaultSettings, {
				...defaultContext,
				currentEnemyName: "Enemy Knight",
			});

			expect(result.action).toBe("attacked");
			expect(result.won).toBe(false); // Enemy Knight е победил → потребителят е загубил
		});

		it("връща won: false ако потребителят е загубил", async () => {
			setPathname("/duel/duel/");
			buildDuelResultDOM("My Knight"); // победил е потребителят

			const result = await engine.runStep(defaultSettings, {
				...defaultContext,
				currentEnemyName: "Enemy Knight",
			});

			expect(result.action).toBe("attacked");
			expect(result.won).toBe(true); // Enemy Knight не е в h1 → потребителят е победил
		});

		it("връща won: false ако currentEnemyName е null", async () => {
			setPathname("/duel/duel/");
			buildDuelResultDOM("Some Knight");

			const result = await engine.runStep(defaultSettings, {
				...defaultContext,
				currentEnemyName: null,
			});

			expect(result.action).toBe("attacked");
			expect(result.won).toBe(false);
		});

		it("включва cooldownMs от settings в waitMs", async () => {
			setPathname("/duel/duel/");
			buildDuelResultDOM("Enemy");

			const result = await engine.runStep(
				{ ...defaultSettings, cooldownMs: 60_000 },
				{ ...defaultContext, currentEnemyName: "Enemy" },
			);

			expect(result.waitMs).toBe(60_000);
		});
	});

	// ── extractEnemyId (индиректно) ───────────────────────────────────────────

	describe("extractEnemyId — индиректно през runStep", () => {
		it("извлича правилно ID от стандартен профилен URL", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Test",
					level: 10,
					loot: 100,
					profileUrl:
						"https://s26-bg.battleknight.gameforge.com:443/common/profile/344255/Scores/Player",
				},
			]);

			const result = await engine.runStep(defaultSettings, defaultContext);
			expect(result.knightId).toBe("344255");
		});

		it("пропуска рицар с невалиден профилен URL", async () => {
			setPathname("/highscore/");
			buildRankingDOM("0", [
				{
					name: "Invalid",
					level: 10,
					loot: 100,
					profileUrl: "https://example.com/invalid-url",
				},
			]);

			const result = await engine.runStep(defaultSettings, defaultContext);
			expect(result.action).toBe("done");
		});
	});
});
