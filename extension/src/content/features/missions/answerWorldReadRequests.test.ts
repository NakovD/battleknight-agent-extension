import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeRuntimeMock } from "@/testUtils/chromeRuntimeMock";
import { answerWorldReadRequests } from "./answerWorldReadRequests";
import worldNormal from "./fixtures/world-normal.html?raw";

describe("answerWorldReadRequests", () => {
	let stop: () => void;

	beforeEach(() => {
		installChromeRuntimeMock();
		document.body.innerHTML = worldNormal;
		stop = answerWorldReadRequests();
	});

	afterEach(() => {
		stop();
	});

	const listener = () =>
		vi.mocked(chrome.runtime.onMessage.addListener).mock.calls[0][0] as (
			raw: unknown,
			sender: unknown,
			sendResponse: (response: unknown) => void,
		) => boolean;

	it("отговаря с прочетената карта", () => {
		const sendResponse = vi.fn();

		listener()({ type: "MISSIONS_READ_WORLD" }, {}, sendResponse);

		expect(sendResponse).toHaveBeenCalledWith(
			expect.objectContaining({ status: "loaded", city: "Талфор" }),
		);
	});

	it("не отговаря на чужди съобщения", () => {
		const sendResponse = vi.fn();

		listener()({ type: "STATUS_UPDATE" }, {}, sendResponse);

		expect(sendResponse).not.toHaveBeenCalled();
	});

	it("спира да слуша след отписване", () => {
		stop();

		expect(chrome.runtime.onMessage.removeListener).toHaveBeenCalledWith(
			listener(),
		);
	});
});
