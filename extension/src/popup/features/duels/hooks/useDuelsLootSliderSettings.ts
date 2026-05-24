import { useSliderSettings } from "@/popup/components/common/form/Slider/hooks/useSliderSettings";
import { sliderSettings } from "@/popup/features/duels/data/sliderSettings";

interface IUseDuelsLootSliderSettings {
	handleLootValueChange: (value: number) => void;
}

export const useDuelsLootSliderSettings = ({
	handleLootValueChange,
}: IUseDuelsLootSliderSettings) =>
	useSliderSettings({
		initialSliderSettings: sliderSettings[2],
		onSettingsChange: (newSettings) =>
			handleLootValueChange(newSettings.max / 2),
	});
