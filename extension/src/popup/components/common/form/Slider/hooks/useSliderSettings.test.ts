import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ISliderSettings } from "@/popup/components/common/form/Slider/models/sliderSettings";
import { useSliderSettings } from "./useSliderSettings";

const tiers: ISliderSettings[] = [
	{ id: 0, min: 0, max: 50, step: 5 },
	{ id: 1, min: 50, max: 150, step: 10 },
	{ id: 2, min: 150, max: 1000, step: 50 },
];

describe("useSliderSettings", () => {
	it("тръгва от подадения initialSliderSettings", () => {
		const { result } = renderHook(() =>
			useSliderSettings({ allSettings: tiers, initialSliderSettings: tiers[1] }),
		);

		expect(result.current.lootSliderSettings).toEqual(tiers[1]);
	});

	it("Next преминава към следващия tier и вика onSettingsChange", () => {
		const onSettingsChange = vi.fn();
		const { result } = renderHook(() =>
			useSliderSettings({
				allSettings: tiers,
				initialSliderSettings: tiers[0],
				onSettingsChange,
			}),
		);

		act(() => {
			result.current.handleLootValueSettingsNext();
		});

		expect(result.current.lootSliderSettings).toEqual(tiers[1]);
		expect(onSettingsChange).toHaveBeenCalledWith(tiers[1]);
	});

	it("Prev преминава към предишния tier и вика onSettingsChange", () => {
		const onSettingsChange = vi.fn();
		const { result } = renderHook(() =>
			useSliderSettings({
				allSettings: tiers,
				initialSliderSettings: tiers[1],
				onSettingsChange,
			}),
		);

		act(() => {
			result.current.handleLootValueSettingsPrev();
		});

		expect(result.current.lootSliderSettings).toEqual(tiers[0]);
		expect(onSettingsChange).toHaveBeenCalledWith(tiers[0]);
	});

	it("Prev на първия tier не прави нищо (не се увива към последния)", () => {
		const onSettingsChange = vi.fn();
		const { result } = renderHook(() =>
			useSliderSettings({
				allSettings: tiers,
				initialSliderSettings: tiers[0],
				onSettingsChange,
			}),
		);

		act(() => {
			result.current.handleLootValueSettingsPrev();
		});

		expect(result.current.lootSliderSettings).toEqual(tiers[0]);
		expect(onSettingsChange).not.toHaveBeenCalled();
	});

	it("Next на последния tier не прави нищо", () => {
		const onSettingsChange = vi.fn();
		const { result } = renderHook(() =>
			useSliderSettings({
				allSettings: tiers,
				initialSliderSettings: tiers[2],
				onSettingsChange,
			}),
		);

		act(() => {
			result.current.handleLootValueSettingsNext();
		});

		expect(result.current.lootSliderSettings).toEqual(tiers[2]);
		expect(onSettingsChange).not.toHaveBeenCalled();
	});
});
