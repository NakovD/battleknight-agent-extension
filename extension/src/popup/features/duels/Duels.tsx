import { Label } from "@/popup/components/common/form/Label";
import { SliderSettingsNavigator } from "@/popup/components/common/form/Slider/components/SliderSettingsNavigator";
import { MultiSlider } from "@/popup/components/common/form/Slider/MultiSlider";
import { Slider } from "@/popup/components/common/form/Slider/Slider";
import { Heading } from "@/popup/components/common/headings/Heading";
import { Tooltip } from "@/popup/components/common/tooltip/Tooltip";
import { DuelsOrderSettings } from "@/popup/features/duels/components/DuelsOrderSettings";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { duelsLevelSliderSettings } from "@/popup/features/duels/data/duelsLevelSliderSettings";
import { duelsLootSliderSettings } from "@/popup/features/duels/data/duelsLootSliderSettings";
import { useDuelsForm } from "@/popup/features/duels/form/duelsContext";
import { useDuelsLevelSliderSettings } from "@/popup/features/duels/hooks/useDuelsLevelSliderSettings";
import { useDuelsLootSliderSettings } from "@/popup/features/duels/hooks/useDuelsLootSliderSettings";
import { duelsFormValidator } from "@/popup/features/duels/validators/duelsFormValidator";
import { withPreventDefaultAndCb } from "@/popup/utilities/domEventUtility";
import { formatNumberAdvanced } from "@/popup/utilities/formatUtility";

export const Duels = () => {
	const form = useDuelsForm({
		validators: { onChange: duelsFormValidator },
		defaultValues: duelsFormDefaultValues,
		onSubmit: (values) => {
			console.log(values);
		},
	});

	const levelSliderSettingsSetup = useDuelsLevelSliderSettings({
		handleLootValueChange: (newSettings) =>
			form.setFieldValue("levels", [
				newSettings.min + newSettings.step,
				newSettings.min + newSettings.step * 2,
			] as [number, number]),
	});

	const lootSliderSettingsSetup = useDuelsLootSliderSettings({
		handleLootValueChange: (newMaxLoot) =>
			form.setFieldValue("maxLoot", newMaxLoot),
	});

	return (
		<form
			className="py-3"
			onSubmit={withPreventDefaultAndCb(form.handleSubmit)}
		>
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
			<DuelsOrderSettings form={form} />
			<Tooltip id="some-tooltip" popover="auto">
				<p>Some tooltip content</p>
			</Tooltip>
			<button popoverTarget="some-tooltip" type="button">
				sup
			</button>

			<button type="submit">submit bace</button>
		</form>
	);
};
