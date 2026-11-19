import { describe, expect, it } from "vitest";
import { createMissionsWhoAmIMessageHandler } from "./missionsWhoAmIMessageHandler";

const fromTab = (id: number) =>
	({ tab: { id } }) as unknown as chrome.runtime.MessageSender;

describe("createMissionsWhoAmIMessageHandler", () => {
	it("казва на content script-а id-то на неговия таб", async () => {
		const handle = createMissionsWhoAmIMessageHandler(Promise.resolve());

		expect(await handle({ type: "MISSIONS_WHO_AM_I" }, fromTab(7))).toEqual({
			tabId: 7,
		});
	});

	it("отговаря чак след като session storage е отворен за content script-а", async () => {
		let openStorage = () => {};
		const storageReady = new Promise<void>((resolve) => {
			openStorage = resolve;
		});
		const handle = createMissionsWhoAmIMessageHandler(storageReady);

		let answered = false;
		const reply = handle({ type: "MISSIONS_WHO_AM_I" }, fromTab(7))?.then(
			() => {
				answered = true;
			},
		);
		await Promise.resolve();
		expect(answered).toBe(false);

		openStorage();
		await reply;
		expect(answered).toBe(true);
	});

	it("не отговаря на съобщение без таб (напр. от popup-а)", () => {
		const handle = createMissionsWhoAmIMessageHandler(Promise.resolve());

		expect(handle({ type: "MISSIONS_WHO_AM_I" }, {})).toBeNull();
	});

	it("връща null за чужди съобщения", () => {
		const handle = createMissionsWhoAmIMessageHandler(Promise.resolve());

		expect(handle({ type: "MISSIONS_GET_STATUS" }, fromTab(7))).toBeNull();
	});
});
