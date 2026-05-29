import { Label } from "@/popup/components/common/form/Label";
import { SliderSettingsNavigator } from "@/popup/components/common/form/Slider/components/SliderSettingsNavigator";
import { MultiSlider } from "@/popup/components/common/form/Slider/MultiSlider";
import { Heading } from "@/popup/components/common/headings/Heading";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { duelsLevelSliderSettings } from "@/popup/features/duels/data/duelsLevelSliderSettings";
import { withDuelsForm } from "@/popup/features/duels/form/duelsContext";
import { useDuelsLevelSliderSettings } from "@/popup/features/duels/hooks/useDuelsLevelSliderSettings";

export const DuelsOpponentLevelSettings = withDuelsForm({
	defaultValues: duelsFormDefaultValues,
	render: ({ form }) => {
		const levelSliderSettingsSetup = useDuelsLevelSliderSettings({
			handleLootValueChange: (newSettings) =>
				form.setFieldValue("levels", [
					newSettings.min + newSettings.step,
					newSettings.min + newSettings.step * 2,
				] as [number, number]),
		});

		return (
			<section className="border-none border-amber-700/50">
				<Heading>Opponent's level</Heading>
				<div className="pb-5" />
				<form.Field
					name="levels"
					children={(field) => (
						<Label>
							From level to level
							<div className="pb-7" />
							<MultiSlider
								lowerValue={field.state.value[0]}
								upperValue={field.state.value[1]}
								step={levelSliderSettingsSetup.lootSliderSettings.step}
								min={levelSliderSettingsSetup.lootSliderSettings.min}
								max={levelSliderSettingsSetup.lootSliderSettings.max}
								onChange={(lowerValue, upperValue) =>
									field.handleChange([lowerValue, upperValue])
								}
							/>
						</Label>
					)}
				/>
				<SliderSettingsNavigator
					handlePrev={levelSliderSettingsSetup.handleLootValueSettingsPrev}
					handleNext={levelSliderSettingsSetup.handleLootValueSettingsNext}
					disabledPrev={levelSliderSettingsSetup.lootSliderSettings.id === 0}
					disabledNext={
						levelSliderSettingsSetup.lootSliderSettings.id ===
						duelsLevelSliderSettings.length - 1
					}
				/>
				<div className="pb-6" />
			</section>
		);
	},
});
