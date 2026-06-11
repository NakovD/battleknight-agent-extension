import { Label } from "@/popup/components/common/form/Label";
import { SliderSettingsNavigator } from "@/popup/components/common/form/Slider/components/SliderSettingsNavigator";
import { Slider } from "@/popup/components/common/form/Slider/Slider";
import { Heading } from "@/popup/components/common/headings/Heading";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { duelsLootSliderSettings } from "@/popup/features/duels/data/duelsLootSliderSettings";
import { withDuelsForm } from "@/popup/features/duels/form/duelsContext";
import { useDuelsLootSliderSettings } from "@/popup/features/duels/hooks/useDuelsLootSliderSettings";
import { formatNumberAdvanced } from "@/popup/utilities/formatUtility";

export const DuelsOpponentLootSettings = withDuelsForm({
	defaultValues: duelsFormDefaultValues,
	render: ({ form }) => {
		const lootSliderSettingsSetup = useDuelsLootSliderSettings({
			handleLootValueChange: (newMaxLoot) =>
				form.setFieldValue("maxLoot", newMaxLoot),
		});

		return (
			<section>
				<Heading>Opponent's loot</Heading>
				<div className="pb-5" />

				<form.Field
					name="maxLoot"
					children={(field) => (
						<Label className="relative">
							Max loot
							<div className="py-5" />
							<Slider
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.valueAsNumber)}
								step={lootSliderSettingsSetup.lootSliderSettings.step}
								min={lootSliderSettingsSetup.lootSliderSettings.min}
								max={lootSliderSettingsSetup.lootSliderSettings.max}
								showScale={false}
								formatLabel={(value) => formatNumberAdvanced(value)}
							/>
							<p className="text-xs absolute -bottom-4 left-0">
								{formatNumberAdvanced(
									lootSliderSettingsSetup.lootSliderSettings.min,
								)}
							</p>
							<p className="text-xs absolute -bottom-4 right-0">
								{formatNumberAdvanced(
									lootSliderSettingsSetup.lootSliderSettings.max,
								)}
							</p>
						</Label>
					)}
				/>
				<SliderSettingsNavigator
					handlePrev={lootSliderSettingsSetup.handleLootValueSettingsPrev}
					handleNext={lootSliderSettingsSetup.handleLootValueSettingsNext}
					disabledPrev={lootSliderSettingsSetup.lootSliderSettings.id === 0}
					disabledNext={
						lootSliderSettingsSetup.lootSliderSettings.id ===
						duelsLootSliderSettings.length - 1
					}
				/>
			</section>
		);
	},
});
