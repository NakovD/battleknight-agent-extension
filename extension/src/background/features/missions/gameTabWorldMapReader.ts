import type { MissionLocationsResult } from "@/common/features/missions/models/missionLocations";
import { missionLocationsResultValidator } from "@/common/features/missions/validators/missionLocationsValidators";

/** Same pattern as the manifest's content script — every server and language. */
export const GAME_TAB_URL_PATTERN = "https://*.battleknight.gameforge.com/*";

type ChromeTabs = Pick<
	typeof chrome.tabs,
	"query" | "update" | "sendMessage" | "onUpdated"
>;

interface IGameTabWorldMapReaderOptions {
	/** How long the game gets to load /world before we give up. */
	pageLoadTimeoutMs: number;
	/**
	 * The content script can start a moment after the tab reports it has
	 * loaded, and until then there is nobody to answer — so ask a few times.
	 */
	readAttempts: number;
	readRetryMs: number;
}

const defaultOptions: IGameTabWorldMapReaderOptions = {
	pageLoadTimeoutMs: 20_000,
	readAttempts: 10,
	readRetryMs: 300,
};

const unreachable: MissionLocationsResult = {
	status: "unavailable",
	reason: "world-unreachable",
};

/**
 * Takes the open game tab to /world and has its content script read the map.
 *
 * The server comes from the tab itself: it differs per player (s26-bg, s27-bg,
 * ...), so there is no address to hardcode.
 */
export class GameTabWorldMapReader {
	private readonly options: IGameTabWorldMapReaderOptions;

	constructor(
		private readonly tabs: ChromeTabs = chrome.tabs,
		options: Partial<IGameTabWorldMapReaderOptions> = {},
	) {
		this.options = { ...defaultOptions, ...options };
	}

	async read(): Promise<MissionLocationsResult> {
		const tab = await this.findGameTab();

		if (tab?.id === undefined || !tab.url) {
			return { status: "unavailable", reason: "game-not-open" };
		}

		// Listening before navigating, or a fast load could finish unseen.
		const loaded = this.waitForLoad(tab.id);
		await this.tabs.update(tab.id, { url: `${new URL(tab.url).origin}/world` });

		if (!(await loaded)) return unreachable;

		return this.askContentScript(tab.id);
	}

	/** The tab the player is looking at, if there are several. */
	private async findGameTab() {
		const tabs = await this.tabs.query({ url: GAME_TAB_URL_PATTERN });
		return tabs.find((tab) => tab.active) ?? tabs[0];
	}

	private waitForLoad(tabId: number) {
		return new Promise<boolean>((resolve) => {
			const finish = (hasLoaded: boolean) => {
				clearTimeout(timeout);
				this.tabs.onUpdated.removeListener(onUpdated);
				resolve(hasLoaded);
			};

			const onUpdated = (
				updatedTabId: number,
				changeInfo: { status?: string },
			) => {
				if (updatedTabId === tabId && changeInfo.status === "complete") {
					finish(true);
				}
			};

			const timeout = setTimeout(
				() => finish(false),
				this.options.pageLoadTimeoutMs,
			);
			this.tabs.onUpdated.addListener(onUpdated);
		});
	}

	private async askContentScript(
		tabId: number,
	): Promise<MissionLocationsResult> {
		for (let attempt = 0; attempt < this.options.readAttempts; attempt++) {
			try {
				const reply = await this.tabs.sendMessage(tabId, {
					type: "MISSIONS_READ_WORLD",
				});
				const result = missionLocationsResultValidator.safeParse(reply);

				// An answer that doesn't parse won't get better by asking again.
				return result.success ? result.data : unreachable;
			} catch {
				// Nobody listening yet — the content script hasn't started.
				await delay(this.options.readRetryMs);
			}
		}

		return unreachable;
	}
}

const delay = (ms: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));
