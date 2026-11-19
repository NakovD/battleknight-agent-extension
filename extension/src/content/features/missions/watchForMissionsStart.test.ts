import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { missionsAgentKey } from "@/common/features/missions/missionsStateStorage";
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
			missionsAgentKey(7),
			{ status: "running" },
			"session",
			{ status: "idle" },
		);

		expect(runMissionStep).toHaveBeenCalledOnce();
	});

	it("не реагира на собствения напредък на агента", () => {
		storage.dispatchChange(
			missionsAgentKey(7),
			{ status: "running", consecutiveNavigations: 2 },
			"session",
			{ status: "running", consecutiveNavigations: 1 },
		);

		expect(runMissionStep).not.toHaveBeenCalled();
	});

	it("не реагира на агента за дуели", () => {
		storage.dispatchChange(
			"duelsExtensionState",
			{ status: "running" },
			"session",
			{ status: "idle" },
		);

		expect(runMissionStep).not.toHaveBeenCalled();
	});

	it("агентът на който и да е таб буди стъпка — тя сама проверява своя таб", () => {
		storage.dispatchChange(
			missionsAgentKey(9),
			{ status: "running" },
			"session",
			undefined,
		);

		expect(runMissionStep).toHaveBeenCalledOnce();
	});

	it("пуска стъпка, когато табът се върне на преден план", () => {
		vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");

		document.dispatchEvent(new Event("visibilitychange"));

		expect(runMissionStep).toHaveBeenCalledOnce();
	});
});
