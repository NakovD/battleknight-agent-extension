import { describe, expect, it } from "vitest";
import { formatDuration } from "./formatUtility";

describe("formatDuration", () => {
	it.each([
		[0, "0:00"],
		[4_000, "0:04"],
		[125_000, "2:05"],
		[3_600_000, "1:00:00"],
		[3_845_000, "1:04:05"],
	])("%i ms → %s", (ms, text) => {
		expect(formatDuration(ms)).toBe(text);
	});

	it("закръгля нагоре, за да не показва 0:00, докато още се чака", () => {
		expect(formatDuration(400)).toBe("0:01");
	});

	it("отрицателно време е нула", () => {
		expect(formatDuration(-5_000)).toBe("0:00");
	});
});
