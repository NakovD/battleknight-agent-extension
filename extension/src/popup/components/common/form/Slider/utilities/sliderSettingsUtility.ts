import type { ISliderSettings } from "@/popup/components/common/form/Slider/models/sliderSettings";

/**
 * The tier whose range contains the value, so a slider restored from saved
 * settings doesn't start on a tier that can't display it.
 */
export const findSliderSettingsForValue = (
	allSettings: ISliderSettings[],
	value: number | undefined,
	fallback: ISliderSettings,
) => {
	if (value === undefined) {
		return fallback;
	}

	return (
		allSettings.find(
			(settings) => value >= settings.min && value <= settings.max,
		) ?? fallback
	);
};
