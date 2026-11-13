import { beforeEach, describe, expect, it } from "vitest";
import worldNoHealth from "./fixtures/world-no-health.html?raw";
import worldNormal from "./fixtures/world-normal.html?raw";
import worldOtherCity from "./fixtures/world-other-city.html?raw";
import worldReturningDuel from "./fixtures/world-returning-duel.html?raw";
import worldReturningGroup from "./fixtures/world-returning-group.html?raw";
import worldReturningMission from "./fixtures/world-returning-mission.html?raw";
import worldTravelling from "./fixtures/world-travelling.html?raw";
import { readWorldPage } from "./readWorldPage";

// Fixture-ите са изрязани от истински страници на играта (виж fixtures/), а не
// написани на ръка — за да не повтарят тестовете грешките на кода.
const loadPage = (html: string) => {
	document.body.innerHTML = html;
};

describe("readWorldPage", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("прочита града и всички локации на картата", () => {
		loadPage(worldNormal);

		expect(readWorldPage()).toEqual({
			status: "loaded",
			city: "Талфор",
			locations: [
				{ id: "CastleRuin", name: "Дворцови руини" },
				{ id: "DragonLair", name: "Драконово леговище" },
				{ id: "Volcano", name: "Вулкан" },
				{ id: "WitchForest", name: "Омагьосана гора" },
				{ id: "DeadLand", name: "Земя на Мъртвите" },
			],
		});
	});

	it("работи и за друг град с различен брой локации", () => {
		loadPage(worldOtherCity);

		expect(readWorldPage()).toEqual({
			status: "loaded",
			city: "Алкран",
			locations: [
				{ id: "Tabour", name: "Укрепен лагер" },
				{ id: "Bridge", name: "Мост" },
				{ id: "Coast", name: "Бряг" },
			],
		});
	});

	it("не брои отворения popup като още една локация", () => {
		loadPage(worldNormal);

		// Така прави играта, когато се кликне локация: копира popup-а в края на
		// страницата, без id-тата.
		const copy = document
			.getElementById("modalgtDragonsLair")
			?.cloneNode(true) as HTMLElement;
		copy.removeAttribute("id");
		for (const element of copy.querySelectorAll("[id]")) {
			element.removeAttribute("id");
		}
		const sbox = document.createElement("div");
		sbox.id = "sbox-content";
		sbox.append(copy);
		document.body.append(sbox);

		const result = readWorldPage();
		expect(result.status === "loaded" && result.locations).toHaveLength(5);
	});

	it("без точки живот зарежда локациите с предупреждение", () => {
		// Бутоните са сиви, но точките за мисия (190) стигат — значи е от живота.
		loadPage(worldNoHealth);

		expect(readWorldPage()).toMatchObject({
			status: "loaded",
			city: "Талфор",
			warning: "no-hit-points",
		});
	});

	it("без точки за мисия казва, че мисиите за деня са свършили", () => {
		loadPage(worldNoHealth);
		// Няма запазена такава страница — същата, но с по-малко точки от най-
		// евтината мисия (20).
		for (const points of document.querySelectorAll(
			"#squeezeBoxContent .missionPoints span",
		)) {
			points.textContent = "15";
		}

		expect(readWorldPage()).toEqual({
			status: "unavailable",
			reason: "no-mission-points",
		});
	});

	it("точно колкото струва най-евтината мисия все още стига", () => {
		loadPage(worldNoHealth);
		for (const points of document.querySelectorAll(
			"#squeezeBoxContent .missionPoints span",
		)) {
			points.textContent = "20";
		}

		expect(readWorldPage()).toMatchObject({ warning: "no-hit-points" });
	});

	it("без бутони за мисии изобщо няма предупреждение", () => {
		loadPage(worldNormal);
		for (const button of document.querySelectorAll(".specialButton")) {
			button.remove();
		}

		expect(readWorldPage()).not.toHaveProperty("warning");
	});

	it("с част от мисиите забранени локациите пак се зареждат", () => {
		loadPage(worldNormal);
		document
			.querySelectorAll("#squeezeBoxContent .devLarge")
			.forEach((button) => {
				button.classList.add("disabledSpecialBtn");
			});

		expect(readWorldPage()).toMatchObject({ status: "loaded" });
		expect(readWorldPage()).not.toHaveProperty("warning");
	});

	it.each([
		[worldTravelling, "traveling", "Пътуване"],
		[
			worldReturningMission,
			"returning-from-mission",
			"Рицарят се връща от мисия",
		],
		[worldReturningDuel, "returning-from-duel", "Връщане след дуела"],
	])("разпознава кога рицарят е зает (%#)", (html, reason, detail) => {
		loadPage(html);

		expect(readWorldPage()).toEqual({ status: "unavailable", reason, detail });
	});

	it("връщането от групова мисия е същото като от обикновена", () => {
		// Играта показва една и съща страница и за двете — и за агента това е
		// едно и също: чака таймера.
		loadPage(worldReturningGroup);

		expect(readWorldPage()).toEqual({
			status: "unavailable",
			reason: "returning-from-mission",
			detail: "Рицарят се връща от мисия",
		});
	});

	it("непознато чакане се отчита като заето, с текста на играта", () => {
		loadPage(
			'<div id="contentTitle"><h1>Работа</h1></div><div id="mainContent" class="cooldownWork"></div>',
		);

		expect(readWorldPage()).toEqual({
			status: "unavailable",
			reason: "busy",
			detail: "Работа",
		});
	});

	it("страница, която не е картата, е недостъпна", () => {
		loadPage(
			'<div id="contentTitle"><h1>Таверна</h1></div><div id="mainContent" class="tavern"></div>',
		);

		expect(readWorldPage()).toEqual({
			status: "unavailable",
			reason: "world-unreachable",
		});
	});

	it("празна страница е недостъпна", () => {
		expect(readWorldPage()).toEqual({
			status: "unavailable",
			reason: "world-unreachable",
		});
	});
});
