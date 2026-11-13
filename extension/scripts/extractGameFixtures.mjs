// Trims pages saved from the game down to test fixtures.
//
//   node scripts/extractGameFixtures.mjs <name>[,<name>...] [--character "<name>"]
//
// Reads ../html/<name>.html (the untracked folder of saved pages) and writes
// src/content/features/missions/fixtures/<name>.html. Keeps only the parts the
// page readers look at, and strips what identifies the account: the csrf token,
// the server's address, and — with --character — the knight's name.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const extensionDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceDir = path.join(extensionDir, "..", "html");
const fixturesDir = path.join(
	extensionDir,
	"src/content/features/missions/fixtures",
);

const KEPT_PARTS = [
	"#contentTitle",
	"#mainContent",
	"#formChooseMission",
	"#squeezeBoxContent",
];

/** Stands in for the player's own knight in every fixture. */
const PLACEHOLDER_CHARACTER = "Тестов Рицар";

const args = process.argv.slice(2);
const characterAt = args.indexOf("--character");
const character = characterAt === -1 ? null : args[characterAt + 1];
const names = args[0]?.startsWith("--") ? [] : (args[0]?.split(",") ?? []);

if (names.length === 0) {
	console.error(
		'Usage: node scripts/extractGameFixtures.mjs <name>[,<name>...] [--character "<name>"]',
	);
	process.exit(1);
}

mkdirSync(fixturesDir, { recursive: true });

for (const name of names) {
	const html = readFileSync(path.join(sourceDir, `${name}.html`), "utf8");
	const doc = new JSDOM(html).window.document;

	doc.querySelector('input[name="csrf_token"]')?.remove();

	let fixture = KEPT_PARTS.map((selector) => doc.querySelector(selector))
		.filter(Boolean)
		.map((element) => element.outerHTML)
		.join("\n")
		.replace(
			/s\d+-bg\.battleknight\.gameforge\.com(:443)?/g,
			"s1-bg.battleknight.gameforge.com",
		)
		.replace(/[ \t]+$/gm, "")
		.replace(/\n{3,}/g, "\n\n");

	if (character) fixture = fixture.replaceAll(character, PLACEHOLDER_CHARACTER);

	writeFileSync(path.join(fixturesDir, `${name}.html`), `${fixture}\n`);
	console.log(`${name}: ${fixture.length} characters`);
}
