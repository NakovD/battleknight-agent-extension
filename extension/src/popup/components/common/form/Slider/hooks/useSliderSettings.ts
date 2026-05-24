import { useState } from "react";
import type { ISliderSettings } from "@/popup/components/common/form/Slider/models/sliderSettings";
import { sliderSettings } from "@/popup/features/duels/data/sliderSettings";

interface IUseSliderSettings {
	initialSliderSettings: ISliderSettings;
	onSettingsChange?: (newSettings: ISliderSettings) => void;
}

export const useSliderSettings = ({
	initialSliderSettings,
	onSettingsChange,
}: IUseSliderSettings) => {
	const [lootSliderSettings, setLootSliderSettings] = useState({
		...initialSliderSettings,
	});

	const handleSettingsUpdate = (newSettings: ISliderSettings | undefined) => {
		if (newSettings && newSettings.id !== lootSliderSettings?.id) {
			setLootSliderSettings(newSettings);
			onSettingsChange?.(newSettings);
			return newSettings;
		}

		return undefined;
	};

	return {
		lootSliderSettings,
		handleLootValueSettingsPrev: () =>
			handleSettingsUpdate(sliderSettings.at(lootSliderSettings.id - 1)),
		handleLootValueSettingsNext: () =>
			handleSettingsUpdate(sliderSettings.at(lootSliderSettings.id + 1)),
	};
};
