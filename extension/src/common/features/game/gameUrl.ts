/** Same domain as the manifest's content script — every server and language. */
const GAME_HOST_SUFFIX = ".battleknight.gameforge.com";

export const isGameUrl = (url: string | undefined) => {
	if (!url) return false;

	try {
		const { protocol, hostname } = new URL(url);
		return protocol === "https:" && hostname.endsWith(GAME_HOST_SUFFIX);
	} catch {
		return false;
	}
};

/** "s27-bg" from s27-bg.battleknight.gameforge.com — which server, in short. */
export const shortServerName = (host: string) => host.split(".")[0] ?? host;
