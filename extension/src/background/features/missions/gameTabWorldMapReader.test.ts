import { describe, expect, it, vi } from "vitest";
import { GameTabWorldMapReader } from "./gameTabWorldMapReader";

type UpdatedListener = (tabId: number, changeInfo: { status?: string }) => void;

const loaded = {
	status: "loaded" as const,
	city: "Талфор",
	locations: [{ id: "Volcano", name: "Вулкан" }],
};

/**
 * Фалшив chrome.tabs с един таб: get() го връща (или пропада, ако tab е
 * null — табът е затворен), update() "зарежда" страницата веднага след
 * навигацията, освен ако loads е false — тогава табът никога не завършва.
 */
const createTabs = ({
	tab = {
		id: 7,
		url: "https://s27-bg.battleknight.gameforge.com/duel",
	} as Partial<chrome.tabs.Tab> | null,
	loads = true,
	replies = [loaded] as unknown[],
} = {}) => {
	const listeners = new Set<UpdatedListener>();
	const pendingReplies = [...replies];

	return {
		get: vi.fn(async () => {
			if (!tab) throw new Error("No tab with id: 7.");
			return tab;
		}),
		update: vi.fn(async (tabId: number) => {
			if (loads) {
				for (const listener of listeners) {
					listener(tabId, { status: "loading" });
				}
				for (const listener of listeners) {
					listener(tabId, { status: "complete" });
				}
			}
			return {};
		}),
		sendMessage: vi.fn(async () => {
			const reply = pendingReplies.shift();
			if (reply instanceof Error) throw reply;
			return reply;
		}),
		onUpdated: {
			addListener: vi.fn((listener: UpdatedListener) =>
				listeners.add(listener),
			),
			removeListener: vi.fn((listener: UpdatedListener) =>
				listeners.delete(listener),
			),
		},
		listenerCount: () => listeners.size,
	};
};

const createReader = (tabs: ReturnType<typeof createTabs>) =>
	new GameTabWorldMapReader(tabs as unknown as typeof chrome.tabs, {
		pageLoadTimeoutMs: 50,
		readAttempts: 3,
		readRetryMs: 1,
	});

const notOpen = { status: "unavailable", reason: "game-not-open" };
const unreachable = { status: "unavailable", reason: "world-unreachable" };

describe("GameTabWorldMapReader", () => {
	it("пренасочва точно този таб към /world на неговия сървър", async () => {
		const tabs = createTabs();

		await createReader(tabs).read(7);

		expect(tabs.get).toHaveBeenCalledWith(7);
		expect(tabs.update).toHaveBeenCalledWith(7, {
			url: "https://s27-bg.battleknight.gameforge.com/world",
		});
	});

	it("връща каквото content script-ът на таба е прочел от картата", async () => {
		const tabs = createTabs();

		expect(await createReader(tabs).read(7)).toEqual(loaded);
		expect(tabs.sendMessage).toHaveBeenCalledWith(7, {
			type: "MISSIONS_READ_WORLD",
		});
	});

	it("затворен таб не се навигира", async () => {
		const tabs = createTabs({ tab: null });

		expect(await createReader(tabs).read(7)).toEqual(notOpen);
		expect(tabs.update).not.toHaveBeenCalled();
	});

	it.each([
		"https://www.google.com/",
		"https://battleknight.gameforge.com.example.com/world",
		"http://s27-bg.battleknight.gameforge.com/world",
		"chrome://extensions/",
	])("таб, който не е на играта, не се навигира (%s)", async (url) => {
		const tabs = createTabs({ tab: { id: 7, url } });

		expect(await createReader(tabs).read(7)).toEqual(notOpen);
		expect(tabs.update).not.toHaveBeenCalled();
	});

	it("пита отново, докато content script-ът още не е стартирал", async () => {
		const tabs = createTabs({
			replies: [new Error("Receiving end does not exist."), loaded],
		});

		expect(await createReader(tabs).read(7)).toEqual(loaded);
		expect(tabs.sendMessage).toHaveBeenCalledTimes(2);
	});

	it("спира да пита след последния опит", async () => {
		const noAnswer = new Error("Receiving end does not exist.");
		const tabs = createTabs({ replies: [noAnswer, noAnswer, noAnswer] });

		expect(await createReader(tabs).read(7)).toEqual(unreachable);
		expect(tabs.sendMessage).toHaveBeenCalledTimes(3);
	});

	it("страница, която не се зарежда, е недостъпна и не оставя listener", async () => {
		const tabs = createTabs({ loads: false });

		expect(await createReader(tabs).read(7)).toEqual(unreachable);
		expect(tabs.sendMessage).not.toHaveBeenCalled();
		expect(tabs.listenerCount()).toBe(0);
	});

	it("невалиден отговор от content script-а е недостъпна карта", async () => {
		const tabs = createTabs({ replies: [{ status: "нещо друго" }] });

		expect(await createReader(tabs).read(7)).toEqual(unreachable);
	});
});
