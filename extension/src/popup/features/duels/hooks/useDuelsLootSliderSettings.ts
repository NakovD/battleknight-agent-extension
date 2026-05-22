import { useState } from "react";
import { sliderSettings } from "@/popup/features/duels/data/sliderSettings";

interface IUseDuelsLootSliderSettings {
	handleSetFormValue: (value: number) => void;
}

export const useDuelsLootSliderSettings = ({
	handleSetFormValue,
}: IUseDuelsLootSliderSettings) => {
	const [lootSliderSettings, setLootSliderSettings] = useState({
		...sliderSettings[2],
	});

	const handleSettingsUpdate = (
		newSettings: (typeof sliderSettings)[number] | undefined,
	) => {
		if (newSettings && newSettings.id !== lootSliderSettings?.id) {
			setLootSliderSettings(newSettings);
			handleSetFormValue(newSettings.max / 2);
		}
	};

	return {
		lootSliderSettings,
		handleLootValueSettingsPrev: () =>
			handleSettingsUpdate(sliderSettings.at(lootSliderSettings.id - 1)),
		handleLootValueSettingsNext: () =>
			handleSettingsUpdate(sliderSettings.at(lootSliderSettings.id + 1)),
	};
};
