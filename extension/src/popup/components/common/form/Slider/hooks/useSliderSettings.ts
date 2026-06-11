import { useState } from "react";
import type { ISliderSettings } from "@/popup/components/common/form/Slider/models/sliderSettings";

interface IUseSliderSettings {
	allSettings: ISliderSettings[];
	initialSliderSettings: ISliderSettings;
	onSettingsChange?: (newSettings: ISliderSettings) => void;
}

export const useSliderSettings = ({
	allSettings,
	initialSliderSettings,
	onSettingsChange,
}: IUseSliderSettings) => {
	const [sliderSettings, setLootSliderSettings] = useState({
		...initialSliderSettings,
	});

	const handleSettingsUpdate = (newSettings: ISliderSettings | undefined) => {
		if (newSettings && newSettings.id !== sliderSettings?.id) {
			setLootSliderSettings(newSettings);
			onSettingsChange?.(newSettings);
			return newSettings;
		}

		return undefined;
	};

	return {
		lootSliderSettings: sliderSettings,
		handleLootValueSettingsPrev: () =>
			handleSettingsUpdate(allSettings.at(sliderSettings.id - 1)),
		handleLootValueSettingsNext: () =>
			handleSettingsUpdate(allSettings.at(sliderSettings.id + 1)),
	};
};
