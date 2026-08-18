import { describe, expect, it } from "vitest";
import { duelsFormValidator } from "./duelsFormValidator";

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
});
