import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DUELS_STORAGE_KEY } from "@/common/features/duels/constants/duelsStateConstants";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";

const runAgentStep = vi.fn();

vi.mock("@/content/features/duels/runAgentStep", () => ({
	runAgentStep: () => runAgentStep(),
}));

const { watchForAgentStart } = await import("./watchForAgentStart");

const stateWith = (status: "idle" | "running" | "error") => ({ status });

describe("watchForAgentStart", () => {
	let chromeStorage: ReturnType<typeof installChromeStorageMock>;
	let stopWatching: () => void;

	beforeEach(() => {
		vi.resetAllMocks();
		chromeStorage = installChromeStorageMock();
		stopWatching = watchForAgentStart();
	});

	// jsdom keeps the same document between tests, so a leftover listener would
	// make the next test see extra calls.
	afterEach(() => stopWatching());

	it("тръгва, когато агентът бъде пуснат, без презареждане на страницата", () => {
		chromeStorage.dispatchChange(
			DUELS_STORAGE_KEY,
			stateWith("running"),
			"local",
			stateWith("idle"),
		);

		expect(runAgentStep).toHaveBeenCalledOnce();
	});

	it("не тръгва при всеки запис на прогрес, докато вече работи", () => {
		chromeStorage.dispatchChange(
			DUELS_STORAGE_KEY,
			{ ...stateWith("running"), consecutiveNavigations: 3 },
			"local",
			{ ...stateWith("running"), consecutiveNavigations: 2 },
		);

		expect(runAgentStep).not.toHaveBeenCalled();
	});

	it("не тръгва при спиране на агента", () => {
		chromeStorage.dispatchChange(
			DUELS_STORAGE_KEY,
			stateWith("idle"),
			"local",
			stateWith("running"),
		);

		expect(runAgentStep).not.toHaveBeenCalled();
	});

	it("игнорира друг storage area и друг ключ", () => {
		chromeStorage.dispatchChange(
			DUELS_STORAGE_KEY,
			stateWith("running"),
			"sync",
			stateWith("idle"),
		);
		chromeStorage.dispatchChange(
			"someOtherKey",
			stateWith("running"),
			"local",
			stateWith("idle"),
		);

		expect(runAgentStep).not.toHaveBeenCalled();
	});

	it("опитва отново, когато табът излезе отпред", () => {
		Object.defineProperty(document, "visibilityState", {
			value: "visible",
			configurable: true,
		});

		document.dispatchEvent(new Event("visibilitychange"));

		expect(runAgentStep).toHaveBeenCalledOnce();
	});

	it("не прави нищо, когато табът е скрит", () => {
		Object.defineProperty(document, "visibilityState", {
			value: "hidden",
			configurable: true,
		});

		document.dispatchEvent(new Event("visibilitychange"));

		expect(runAgentStep).not.toHaveBeenCalled();
	});
});
