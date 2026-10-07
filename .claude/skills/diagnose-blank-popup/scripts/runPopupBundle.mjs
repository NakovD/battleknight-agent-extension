/**
 * Runs a BUILT popup bundle in jsdom, to reproduce a blank popup without a browser.
 *
 * Usage, from the extension directory:
 *   node ../.claude/skills/diagnose-blank-popup/scripts/runPopupBundle.mjs \
 *     "$(pwd)/dist/$(grep -o 'assets/index\.html-[A-Za-z0-9_-]*\.js' dist/src/popup/index.html | head -1)"
 *
 * Pass an ABSOLUTE path inside the extension — jsdom is resolved relative to it.
 * A duplicated React prints the null-dispatcher TypeError and an empty root; a
 * healthy bundle prints the popup's markup.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const entry = process.argv[2];

if (!entry) {
	console.error("Pass the absolute path of a built popup chunk. See the header.");
	process.exit(2);
}

const entryUrl = pathToFileURL(entry).href;
const { JSDOM } = createRequire(entryUrl)("jsdom");

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
	url: "chrome-extension://abcdefghijklmnopabcdefghijklmnop/src/popup/index.html",
	pretendToBeVisual: true,
});

const globals = [
	"window", "document", "navigator", "HTMLElement", "Element", "Node", "Event",
	"CustomEvent", "MutationObserver", "requestAnimationFrame",
	"cancelAnimationFrame", "getComputedStyle", "DocumentFragment", "SVGElement",
];

for (const key of globals) {
	// Some of these are getter-only on globalThis, hence defineProperty.
	try {
		Object.defineProperty(globalThis, key, {
			value: dom.window[key],
			configurable: true,
			writable: true,
		});
	} catch {}
}

globalThis.self = dom.window;

// The popup messages the background as it mounts; answer like a service worker.
globalThis.chrome = {
	runtime: {
		sendMessage: (_message, callback) =>
			callback?.({
				ok: true,
				state: { status: "idle", errorMessage: null, settings: null },
			}),
		onMessage: { addListener() {}, removeListener() {} },
		lastError: undefined,
	},
	storage: {
		local: {
			get: (_keys, callback) => callback({}),
			set: (_values, callback) => callback?.(),
			remove: (_keys, callback) => callback?.(),
		},
		onChanged: { addListener() {} },
	},
};

// React rethrows render errors asynchronously, so catch them here too.
process.on("uncaughtException", (error) => {
	console.log("THREW:", error.message);
	console.log(error.stack?.split("\n").slice(0, 8).join("\n"));
	console.log("EMPTY ROOT (white square)");
	process.exit(3);
});

try {
	await import(entryUrl);
	await new Promise((resolve) => setTimeout(resolve, 300));

	const root = dom.window.document.getElementById("root");

	console.log("RENDERED bytes:", root.innerHTML.length);
	console.log(
		root.innerHTML.length < 40
			? "EMPTY ROOT (white square)"
			: root.innerHTML.slice(0, 200),
	);
} catch (error) {
	console.log("THREW:", error.message);
	console.log(error.stack?.split("\n").slice(0, 8).join("\n"));
	process.exit(3);
}
