import { useSliderSettings } from "@/popup/components/common/form/Slider/hooks/useSliderSettings";
import type { ISliderSettings } from "@/popup/components/common/form/Slider/models/sliderSettings";
import { duelsLevelSliderSettings } from "@/popup/features/duels/data/duelsLevelSliderSettings";

interface IUseDuelsLevelSliderSettings {
	handleLootValueChange: (newSettings: ISliderSettings) => void;
}

export const useDuelsLevelSliderSettings = ({
	handleLootValueChange,
}: IUseDuelsLevelSliderSettings) =>
	useSliderSettings({
		allSettings: duelsLevelSliderSettings,
		initialSliderSettings: duelsLevelSliderSettings[0],
		onSettingsChange: (newSettings) => handleLootValueChange(newSettings),
	});
