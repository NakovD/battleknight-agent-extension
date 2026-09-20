import { describe, expect, it } from "vitest";
import { duelsLevelSliderSettings } from "@/popup/features/duels/data/duelsLevelSliderSettings";
import { findSliderSettingsForValue } from "./sliderSettingsUtility";

const [first, second, third] = duelsLevelSliderSettings;

describe("findSliderSettingsForValue", () => {
	it("връща степента, в чийто обхват попада стойността", () => {
		expect(findSliderSettingsForValue(duelsLevelSliderSettings, 800, first)).toEqual(
			third,
		);
	});

	it("работи и по границите на обхвата", () => {
		expect(findSliderSettingsForValue(duelsLevelSliderSettings, 50, third)).toEqual(
			first,
		);
	});

	it("връща подадената степен по подразбиране без стойност", () => {
		expect(
			findSliderSettingsForValue(duelsLevelSliderSettings, undefined, second),
		).toEqual(second);
	});

	it("връща степента по подразбиране за стойност извън всички обхвати", () => {
		expect(
			findSliderSettingsForValue(duelsLevelSliderSettings, 99_999, second),
		).toEqual(second);
	});
});
