import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MISSIONS_STORAGE_KEY } from "@/common/features/missions/missionsStateStorage";
import { installChromeStorageMock } from "@/testUtils/chromeStorageMock";

const runMissionStep = vi.fn();

vi.mock("@/content/features/missions/runMissionStep", () => ({
	runMissionStep: () => runMissionStep(),
}));

const { watchForMissionsStart } = await import("./watchForMissionsStart");

describe("watchForMissionsStart", () => {
	let storage: ReturnType<typeof installChromeStorageMock>;
	let stop: () => void;

	beforeEach(() => {
		runMissionStep.mockReset();
		storage = installChromeStorageMock();
		stop = watchForMissionsStart();
	});

	afterEach(() => {
		stop();
	});

	it("пуска стъпка в момента, в който агентът стартира", () => {
		storage.dispatchChange(
			MISSIONS_STORAGE_KEY,
			{ status: "running" },
			"local",
			{ status: "idle" },
		);

		expect(runMissionStep).toHaveBeenCalledOnce();
	});

	it("не реагира на собствения напредък на агента", () => {
		storage.dispatchChange(
			MISSIONS_STORAGE_KEY,
			{ status: "running", consecutiveNavigations: 2 },
			"local",
			{ status: "running", consecutiveNavigations: 1 },
		);

		expect(runMissionStep).not.toHaveBeenCalled();
	});

	it("не реагира на агента за дуели", () => {
		storage.dispatchChange(
			"duelsExtensionState",
			{ status: "running" },
			"local",
			{ status: "idle" },
		);

		expect(runMissionStep).not.toHaveBeenCalled();
	});

	it("пуска стъпка, когато табът се върне на преден план", () => {
		vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");

		document.dispatchEvent(new Event("visibilitychange"));

		expect(runMissionStep).toHaveBeenCalledOnce();
	});
});
