import { useSliderSettings } from "@/popup/components/common/form/Slider/hooks/useSliderSettings";
import type { ISliderSettings } from "@/popup/components/common/form/Slider/models/sliderSettings";
import { findSliderSettingsForValue } from "@/popup/components/common/form/Slider/utilities/sliderSettingsUtility";
import { duelsLevelSliderSettings } from "@/popup/features/duels/data/duelsLevelSliderSettings";

interface IUseDuelsLevelSliderSettings {
	handleLootValueChange: (newSettings: ISliderSettings) => void;
	/** Current level, so a restored value starts on the tier that can show it. */
	initialValue?: number;
}

export const useDuelsLevelSliderSettings = ({
	handleLootValueChange,
	initialValue,
}: IUseDuelsLevelSliderSettings) =>
	useSliderSettings({
		allSettings: duelsLevelSliderSettings,
		initialSliderSettings: findSliderSettingsForValue(
			duelsLevelSliderSettings,
			initialValue,
			duelsLevelSliderSettings[0],
		),
		onSettingsChange: (newSettings) => handleLootValueChange(newSettings),
	});
