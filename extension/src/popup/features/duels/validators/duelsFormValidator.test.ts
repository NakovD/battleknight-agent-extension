import { describe, expect, it } from "vitest";
import {
	duelsFormValidator,
	MAX_ORDER_NAME_LENGTH,
	MAX_ORDERS_TO_SKIP,
} from "./duelsFormValidator";

const validForm = {
	maxLoot: 3_000_000,
	skipWithOrder: false,
	skipSpecificOrders: false,
	specificOrders: [],
	levels: [0, 30],
	page: { label: "1-100", value: "0" },
	cooldownMinutes: 2,
};

describe("duelsFormValidator", () => {
	it("приема валиден пълен обект", () => {
		expect(duelsFormValidator.safeParse(validForm).success).toBe(true);
	});

	it("приема maxLoot: 0", () => {
		const result = duelsFormValidator.safeParse({ ...validForm, maxLoot: 0 });

		expect(result.success).toBe(true);
	});

	it("отхвърля отрицателен maxLoot", () => {
		const result = duelsFormValidator.safeParse({ ...validForm, maxLoot: -1 });

		expect(result.success).toBe(false);
	});

	it("приема cooldownMinutes: 1 (долна граница)", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			cooldownMinutes: 1,
		});

		expect(result.success).toBe(true);
	});

	it("отхвърля cooldownMinutes: 0", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			cooldownMinutes: 0,
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля отрицателен cooldownMinutes", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			cooldownMinutes: -5,
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля levels с по-малко от 2 елемента", () => {
		const result = duelsFormValidator.safeParse({ ...validForm, levels: [10] });

		expect(result.success).toBe(false);
	});

	it("отхвърля levels с повече от 2 елемента", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			levels: [10, 20, 30],
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля levels с не-числови елементи", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			levels: ["0", "30"],
		});

		expect(result.success).toBe(false);
	});

	it("приема specificOrders с няколко ордена", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			skipWithOrder: true,
			skipSpecificOrders: true,
			specificOrders: [{ name: "Орден А" }, { name: "Орден Б" }],
		});

		expect(result.success).toBe(true);
	});

	it("отхвърля specificOrders елемент без name", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			specificOrders: [{}],
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля page без value", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			page: { label: "1-100" },
		});

		expect(result.success).toBe(false);
	});

	it("отхвърля липсващо задължително поле", () => {
		const { page: _page, ...withoutPage } = validForm;

		const result = duelsFormValidator.safeParse(withoutPage);

		expect(result.success).toBe(false);
	});

	it("отхвърля грешен тип за булево поле", () => {
		const result = duelsFormValidator.safeParse({
			...validForm,
			skipWithOrder: "yes",
		});

		expect(result.success).toBe(false);
	});

	describe("имена на ордени", () => {
		const withOrders = (names: string[]) => ({
			...validForm,
			skipWithOrder: true,
			skipSpecificOrders: true,
			specificOrders: names.map((name) => ({ name })),
		});

		it("приема списък с нормални имена", () => {
			expect(
				duelsFormValidator.safeParse(withOrders(["Тамплиери"])).success,
			).toBe(true);
		});

		it("отхвърля празно име с грешка върху самия ред", () => {
			const result = duelsFormValidator.safeParse(
				withOrders(["Тамплиери", "  "]),
			);

			expect(result.success).toBe(false);
			// Пътят сочи реда, за да може грешката да се покаже точно под него.
			expect(result.error?.issues[0]?.path).toEqual([
				"specificOrders",
				1,
				"name",
			]);
			expect(result.error?.issues[0]?.message).toBe(
				"Enter an order name or remove the row",
			);
		});

		it("отхвърля прекалено дълго име", () => {
			const result = duelsFormValidator.safeParse(
				withOrders(["x".repeat(MAX_ORDER_NAME_LENGTH + 1)]),
			);

			expect(result.success).toBe(false);
			expect(result.error?.issues[0]?.path).toEqual([
				"specificOrders",
				0,
				"name",
			]);
		});

		it("приема име точно на горната граница", () => {
			const result = duelsFormValidator.safeParse(
				withOrders(["x".repeat(MAX_ORDER_NAME_LENGTH)]),
			);

			expect(result.success).toBe(true);
		});

		it("мери дължината след изчистване на интервалите", () => {
			const result = duelsFormValidator.safeParse(
				withOrders([` ${"x".repeat(MAX_ORDER_NAME_LENGTH)} `]),
			);

			expect(result.success).toBe(true);
		});

		it("отхвърля повече ордени, отколкото API-то приема", () => {
			const result = duelsFormValidator.safeParse(
				withOrders(
					Array.from({ length: MAX_ORDERS_TO_SKIP + 1 }, (_, i) => `o${i}`),
				),
			);

			expect(result.success).toBe(false);
			expect(result.error?.issues[0]?.path).toEqual(["specificOrders"]);
		});

		it("приема точно толкова ордени, колкото API-то приема", () => {
			const result = duelsFormValidator.safeParse(
				withOrders(
					Array.from({ length: MAX_ORDERS_TO_SKIP }, (_, i) => `o${i}`),
				),
			);

			expect(result.success).toBe(true);
		});

		it("не проверява имената, когато ордените не се ползват", () => {
			// Редовете са скрити, докато двата ключа не са вдигнати — иначе забравен
			// празен ред би изключил Start с грешка, която не се вижда никъде.
			expect(
				duelsFormValidator.safeParse({
					...validForm,
					skipWithOrder: true,
					skipSpecificOrders: false,
					specificOrders: [{ name: "" }],
				}).success,
			).toBe(true);

			expect(
				duelsFormValidator.safeParse({
					...validForm,
					skipWithOrder: false,
					skipSpecificOrders: true,
					specificOrders: [{ name: "" }],
				}).success,
			).toBe(true);
		});
	});
});
