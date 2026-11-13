import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
	manifest_version: 3,
	name: pkg.name,
	version: pkg.version,
	icons: {
		48: "public/logo.png",
	},
	action: {
		default_icon: {
			48: "public/logo.png",
		},
		default_popup: "src/popup/index.html",
	},
	permissions: ["sidePanel", "contentSettings", "storage"],
	// Lets the background find the game tab and send it to /world. Same pattern as
	// the content script, so it asks the player for nothing new.
	host_permissions: ["https://*.battleknight.gameforge.com/*"],
	background: {
		service_worker: "src/background/main.ts",
		type: "module",
	},
	content_scripts: [
		{
			js: ["src/content/index.ts"],
			matches: ["https://*.battleknight.gameforge.com/*"],
		},
	],
	side_panel: {
		default_path: "src/sidepanel/index.html",
	},
});
