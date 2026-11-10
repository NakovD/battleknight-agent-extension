import { describe, expect, it, vi } from "vitest";
import {
	GAME_TAB_URL_PATTERN,
	GameTabWorldMapReader,
} from "./gameTabWorldMapReader";

type UpdatedListener = (tabId: number, changeInfo: { status?: string }) => void;

const loaded = {
	status: "loaded" as const,
	city: "Талфор",
	locations: [{ id: "Volcano", name: "Вулкан" }],
};

/**
 * Фалшив chrome.tabs: update() "зарежда" страницата веднага след
 * навигацията, освен ако loads е false — тогава табът никога не завършва.
 */
const createTabs = ({
	tabs = [
		{
			id: 7,
			active: true,
			url: "https://s27-bg.battleknight.gameforge.com/duel",
		},
	] as Partial<chrome.tabs.Tab>[],
	loads = true,
	replies = [loaded] as unknown[],
} = {}) => {
	const listeners = new Set<UpdatedListener>();
	const pendingReplies = [...replies];

	const fake = {
		query: vi.fn(async () => tabs),
		update: vi.fn(async (tabId: number) => {
			if (loads) {
				for (const listener of listeners)
					listener(tabId, { status: "loading" });
				for (const listener of listeners)
					listener(tabId, { status: "complete" });
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

	return fake;
};

const createReader = (tabs: ReturnType<typeof createTabs>) =>
	new GameTabWorldMapReader(tabs as unknown as typeof chrome.tabs, {
		pageLoadTimeoutMs: 50,
		readAttempts: 3,
		readRetryMs: 1,
	});

describe("GameTabWorldMapReader", () => {
	it("пренасочва таба с играта към /world на неговия сървър", async () => {
		const tabs = createTabs();

		await createReader(tabs).read();

		expect(tabs.query).toHaveBeenCalledWith({ url: GAME_TAB_URL_PATTERN });
		expect(tabs.update).toHaveBeenCalledWith(7, {
			url: "https://s27-bg.battleknight.gameforge.com/world",
		});
	});

	it("връща каквото content script-ът е прочел от картата", async () => {
		const tabs = createTabs();

		expect(await createReader(tabs).read()).toEqual(loaded);
		expect(tabs.sendMessage).toHaveBeenCalledWith(7, {
			type: "MISSIONS_READ_WORLD",
		});
	});

	it("предпочита активния таб, когато играта е отворена в няколко", async () => {
		const tabs = createTabs({
			tabs: [
				{
					id: 1,
					active: false,
					url: "https://s26-bg.battleknight.gameforge.com/",
				},
				{
					id: 2,
					active: true,
					url: "https://s27-bg.battleknight.gameforge.com/",
				},
			],
		});

		await createReader(tabs).read();

		expect(tabs.update).toHaveBeenCalledWith(2, {
			url: "https://s27-bg.battleknight.gameforge.com/world",
		});
	});

	it("без отворена игра не навигира никъде", async () => {
		const tabs = createTabs({ tabs: [] });

		expect(await createReader(tabs).read()).toEqual({
			status: "unavailable",
			reason: "game-not-open",
		});
		expect(tabs.update).not.toHaveBeenCalled();
	});

	it("пита отново, докато content script-ът още не е стартирал", async () => {
		const tabs = createTabs({
			replies: [new Error("Receiving end does not exist."), loaded],
		});

		expect(await createReader(tabs).read()).toEqual(loaded);
		expect(tabs.sendMessage).toHaveBeenCalledTimes(2);
	});

	it("спира да пита след последния опит", async () => {
		const noAnswer = new Error("Receiving end does not exist.");
		const tabs = createTabs({ replies: [noAnswer, noAnswer, noAnswer] });

		expect(await createReader(tabs).read()).toEqual({
			status: "unavailable",
			reason: "world-unreachable",
		});
		expect(tabs.sendMessage).toHaveBeenCalledTimes(3);
	});

	it("страница, която не се зарежда, е недостъпна и не оставя listener", async () => {
		const tabs = createTabs({ loads: false });

		expect(await createReader(tabs).read()).toEqual({
			status: "unavailable",
			reason: "world-unreachable",
		});
		expect(tabs.sendMessage).not.toHaveBeenCalled();
		expect(tabs.listenerCount()).toBe(0);
	});

	it("невалиден отговор от content script-а е недостъпна карта", async () => {
		const tabs = createTabs({ replies: [{ status: "нещо друго" }] });

		expect(await createReader(tabs).read()).toEqual({
			status: "unavailable",
			reason: "world-unreachable",
		});
	});
});
