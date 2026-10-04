import { useSliderSettings } from "@/popup/components/common/form/Slider/hooks/useSliderSettings";
import { findSliderSettingsForValue } from "@/popup/components/common/form/Slider/utilities/sliderSettingsUtility";
import { duelsLootSliderSettings } from "@/popup/features/duels/data/duelsLootSliderSettings";

interface IUseDuelsLootSliderSettings {
	handleLootValueChange: (value: number) => void;
	/** Current loot, so a restored value starts on the tier that can show it. */
	initialValue?: number;
}

export const useDuelsLootSliderSettings = ({
	handleLootValueChange,
	initialValue,
}: IUseDuelsLootSliderSettings) =>
	useSliderSettings({
		allSettings: duelsLootSliderSettings,
		initialSliderSettings: findSliderSettingsForValue(
			duelsLootSliderSettings,
			initialValue,
			duelsLootSliderSettings[2],
		),
		onSettingsChange: (newSettings) => handleLootValueChange(newSettings.max / 2),
	});
