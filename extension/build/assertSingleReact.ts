/**
 * Guards against React ending up in a production bundle twice.
 *
 * react-dom installs its hook dispatcher on one React copy. Components built
 * against the other copy then read a dispatcher that was never set, and the
 * first hook call fails with "Cannot read properties of null (reading
 * 'useState')" from inside the React chunk, leaving an empty popup.
 *
 * It is a miserable thing to debug in a browser, so the build refuses to emit
 * a bundle that contains it. Both ways it has bitten this project are covered:
 * two different React files, and one React file loaded by two chunks.
 */

/** `node_modules/react/cjs/react.production.js` and its dev/profiling siblings. */
const reactCorePattern =
	/[\\/]node_modules[\\/]react[\\/]cjs[\\/]react\.[^\\/]*\.js$/;

/**
 * The dev server's pre-bundle, which carries its own copy of React. Harmless
 * while serving, a duplicate the moment a production build resolves through it
 * — and the cache outlives the dependency it was built from, so a stale one
 * sits there until something deletes it.
 */
const prebundledDepPattern = /[\\/]node_modules[\\/]\.vite[\\/]deps[\\/]/;

const prebundledReactPattern = /[\\/](?:react|react-dom)(?:_[^\\/]*)?\.js$/;

/** Module ids per emitted chunk, as a bundler's generateBundle hook sees them. */
export type ChunkModules = Record<string, readonly string[]>;

export const findReactDuplication = (chunks: ChunkModules): string[] => {
	const problems: string[] = [];
	const chunksByCore = new Map<string, string[]>();

	for (const [chunk, modules] of Object.entries(chunks)) {
		for (const id of modules) {
			if (reactCorePattern.test(id)) {
				chunksByCore.set(id, [...(chunksByCore.get(id) ?? []), chunk]);
			}

			if (prebundledDepPattern.test(id) && prebundledReactPattern.test(id)) {
				problems.push(
					`${id} is the dev server's pre-bundled React, which must not reach a production bundle. ` +
						"Delete node_modules/.vite and build again.",
				);
			}
		}
	}

	if (chunksByCore.size > 1) {
		problems.push(
			`React is bundled from ${chunksByCore.size} different files: ${[...chunksByCore.keys()].join(", ")}.`,
		);
	}

	for (const [core, inChunks] of chunksByCore) {
		if (inChunks.length > 1) {
			problems.push(
				`${core} is loaded by ${inChunks.length} chunks (${inChunks.join(", ")}), ` +
					"so each gets its own React instance. Keep React in a single shared chunk.",
			);
		}
	}

	return problems;
};
