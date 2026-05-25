import { useSliderSettings } from "@/popup/components/common/form/Slider/hooks/useSliderSettings";
import { duelsLootSliderSettings } from "@/popup/features/duels/data/duelsLootSliderSettings";

interface IUseDuelsLootSliderSettings {
	handleLootValueChange: (value: number) => void;
}

export const useDuelsLootSliderSettings = ({
	handleLootValueChange,
}: IUseDuelsLootSliderSettings) =>
	useSliderSettings({
		allSettings: duelsLootSliderSettings,
		initialSliderSettings: duelsLootSliderSettings[2],
		onSettingsChange: (newSettings) =>
			handleLootValueChange(newSettings.max / 2),
	});
