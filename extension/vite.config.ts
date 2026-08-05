/// <reference types="vitest/config" />
import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.config.js";
import { name, version } from "./package.json";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
	},
	resolve: {
		alias: {
			"@": `${path.resolve(__dirname, "src")}`,
		},
	},
	plugins: [
		react(),
		crx({ manifest }),
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
