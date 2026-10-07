/// <reference types="vitest/config" />
import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import { findReactDuplication } from "./build/assertSingleReact";
import manifest from "./manifest.config.js";
import { name, version } from "./package.json";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/testUtils/vitestSetup.ts"],
	},
	resolve: {
		alias: {
			"@": `${path.resolve(__dirname, "src")}`,
		},
	},
	plugins: [
		react(),
		crx({ manifest }),
		{
			// Twice now a duplicated React has shipped and only shown up as an empty
			// popup in the browser. Cheaper to fail the build.
			name: "assert-single-react",
			// Nothing to check while serving or testing, and vitest reads this same
			// config — so stay out of its way entirely.
			apply: "build",
			generateBundle(_options, bundle) {
				const chunks = Object.fromEntries(
					Object.entries(bundle)
						.filter(([, output]) => output.type === "chunk")
						.map(([file, output]) => [
							file,
							Object.keys(
								(output as { modules: Record<string, unknown> }).modules,
							),
						]),
				);

				const problems = findReactDuplication(chunks);

				if (problems.length > 0) {
					this.error(
						["React would be bundled more than once:", ...problems].join(
							"\n  - ",
						),
					);
				}
			},
		},
		zip({ outDir: "release", outFileName: `crx-${name}-${version}.zip` }),
		tailwindcss(),
	],
	build: {
		rollupOptions: {
			output: {
				// Popup и sidepanel и двата зареждат React — без това Rollup
				// дублира React в отделните entry chunk-ове (popup/sidepanel),
				// което води до два инстанцирани копия и "useState of null" крашове.
				manualChunks(id) {
					if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
						return "vendor-react";
					}
				},
			},
		},
	},
	server: {
		cors: {
			origin: [/chrome-extension:\/\//],
		},
	},
});
