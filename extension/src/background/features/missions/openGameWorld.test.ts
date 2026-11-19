import { describe, expect, it, vi } from "vitest";
import { openGameWorld } from "./openGameWorld";

const tabsWith = (tab: Partial<chrome.tabs.Tab> | null) => ({
	get: vi.fn(async () => {
		if (!tab) throw new Error("No tab with id: 7.");
		return tab as chrome.tabs.Tab;
	}),
	update: vi.fn(async () => ({}) as chrome.tabs.Tab),
});

describe("openGameWorld", () => {
	it("отваря /world на сървъра на таба", async () => {
		const tabs = tabsWith({
			id: 7,
			url: "https://s27-bg.battleknight.gameforge.com/world/location",
		});

		await openGameWorld(7, tabs);

		expect(tabs.update).toHaveBeenCalledWith(7, {
			url: "https://s27-bg.battleknight.gameforge.com/world",
		});
	});

	it("не прави нищо със затворен таб", async () => {
		const tabs = tabsWith(null);

		await openGameWorld(7, tabs);

		expect(tabs.update).not.toHaveBeenCalled();
	});

	it("не навигира таб, който вече не е на играта", async () => {
		const tabs = tabsWith({ id: 7, url: "https://www.google.com/" });

		await openGameWorld(7, tabs);

		expect(tabs.update).not.toHaveBeenCalled();
	});
});
