import { describe, expect, it } from "vitest";
import { type ChunkModules, findReactDuplication } from "./assertSingleReact";

const root =
	"C:/Users/david/source/repos/battleknight-agent-extension/extension";

const reactCore = `${root}/node_modules/react/cjs/react.production.js`;
const reactDom = `${root}/node_modules/react-dom/cjs/react-dom-client.production.js`;
const jsxRuntime = `${root}/node_modules/react/cjs/react-jsx-runtime.production.js`;

const healthy: ChunkModules = {
	"assets/vendor-react-DXPmlod3.js": [
		reactCore,
		`${root}/node_modules/react/index.js`,
		reactDom,
		jsxRuntime,
		`${root}/node_modules/scheduler/cjs/scheduler.production.js`,
	],
	"assets/index.html-BQOC_QTI.js": [`${root}/src/popup/main.tsx`],
};

describe("findReactDuplication", () => {
	it("приема bundle с едно React копие в общ chunk", () => {
		expect(findReactDuplication(healthy)).toEqual([]);
	});

	it("не бърка jsx-runtime с второ ядро", () => {
		// Живее в същата папка и се казва почти същото, но няма свой dispatcher.
		expect(findReactDuplication({ a: [reactCore, jsxRuntime] })).toEqual([]);
	});

	it("хваща две различни React ядра", () => {
		const problems = findReactDuplication({
			a: [reactCore],
			b: [`${root}/node_modules/react/cjs/react.development.js`],
		});

		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("2 different files");
	});

	it("хваща едно ядро, попаднало в два chunk-а", () => {
		// Точно това дублира React по време на изпълнение: всеки chunk получава
		// свой инстанс, а react-dom закача dispatcher-а само към единия.
		const problems = findReactDuplication({
			"assets/popup.js": [reactCore],
			"assets/sidepanel.js": [reactCore],
		});

		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("2 chunks");
	});

	it("хваща prebundle-а на dev сървъра", () => {
		const problems = findReactDuplication({
			a: [reactCore, `${root}/node_modules/.vite/deps/react.js`],
		});

		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("node_modules/.vite");
	});

	it("хваща и prebundle-нат react-dom", () => {
		const problems = findReactDuplication({
			a: [`${root}/node_modules/.vite/deps/react-dom_client.js`],
		});

		expect(problems).toHaveLength(1);
	});

	it("не се подвежда от обратни наклонени черти на Windows", () => {
		const problems = findReactDuplication({
			a: [String.raw`C:\repo\node_modules\react\cjs\react.production.js`],
			b: [String.raw`C:\repo\node_modules\react\cjs\react.development.js`],
		});

		expect(problems).toHaveLength(1);
	});

	it("не докладва нищо за bundle без React", () => {
		expect(
			findReactDuplication({ a: [`${root}/src/background/main.ts`] }),
		).toEqual([]);
	});
});
