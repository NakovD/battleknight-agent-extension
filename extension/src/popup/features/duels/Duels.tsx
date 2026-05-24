import { useForm } from "@tanstack/react-form";
import { ChevronsLeft, ChevronsRight, CirclePlus, Trash2 } from "lucide-react";
import { IconButton } from "@/popup/components/common/button/iconButton/IconButton";
import { Input } from "@/popup/components/common/form/Input";
import { Label } from "@/popup/components/common/form/Label";
import { SliderSettingsNavigator } from "@/popup/components/common/form/Slider/components/SliderSettingsNavigator";
import { useSliderSettings } from "@/popup/components/common/form/Slider/hooks/useSliderSettings";
import { MultiSlider } from "@/popup/components/common/form/Slider/MultiSlider";
import { Slider } from "@/popup/components/common/form/Slider/Slider";
import { Toggle } from "@/popup/components/common/form/Toggle";
import { Heading } from "@/popup/components/common/headings/Heading";
import { Tooltip } from "@/popup/components/common/tooltip/Tooltip";
import { sliderSettings } from "@/popup/features/duels/data/sliderSettings";
import { useDuelsLootSliderSettings } from "@/popup/features/duels/hooks/useDuelsLootSliderSettings";
import { withPreventDefaultAndCb } from "@/popup/utilities/domEventUtility";
import { formatNumberAdvanced } from "@/popup/utilities/formatUtility";

export const Duels = () => {
	const form = useForm({
		defaultValues: {
			maxLoot: 3_000_000,
			skipWithOrder: false,
			skipSpecificOrders: false,
			specificOrders: [] as { name: string }[],
			levels: [1, 30] as [number, number],
		},
		onSubmit: (values) => {
			console.log(values);
		},
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
								step={10}
								onChange={(lowerValue, upperValue) =>
									field.handleChange([lowerValue, upperValue])
								}
							/>
						</Label>
					)}
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
						sliderSettings.length - 1
					}
				/>
			</section>
			<section>
				<Heading>Order settings</Heading>
				<div className="pb-5" />
				<form.Field
					name="skipWithOrder"
					children={(field) => (
						<Label htmlFor="skip-with-order">
							Skip with order
							<Toggle
								id="skip-with-order"
								onChange={() => field.handleChange(!field.state.value)}
								value={field.state.value}
							/>
						</Label>
					)}
				/>
				<div className="pb-4" />
				<div className="relative">
					<form.Field
						name="skipSpecificOrders"
						children={(field) => (
							<Label htmlFor="skip-specific-orders">
								Skip specific orders
								<Toggle
									id="skip-specific-orders"
									onChange={() => field.handleChange(!field.state.value)}
									value={field.state.value}
								/>
							</Label>
						)}
					/>
					<form.Subscribe
						selector={(state) => state.values.skipSpecificOrders}
						children={(skipSpecificOrders) =>
							skipSpecificOrders && (
								<>
									<div className="pb-3" />
									<form.Field
										name="specificOrders"
										mode="array"
										children={(arrayField) => (
											<>
												<IconButton
													className="absolute top-6 right-0"
													onClick={() => arrayField.pushValue({ name: "" })}
												>
													<CirclePlus width={20} height={20} />
												</IconButton>
												<div className="grid grid-flow-row gap-2">
													{arrayField.state.value.map((_, index) => (
														<form.Field
															// biome-ignore lint/suspicious/noArrayIndexKey: Its fine in this case since we don't have any other unique identifier for the orders
															key={index}
															name={`specificOrders[${index}]`}
															children={() => (
																<Label
																	className="flex items-center gap-4"
																	htmlFor={`specificOrders[${index}]`}
																>
																	<Input
																		id={`specificOrders[${index}]`}
																		placeholder="Order name..."
																	/>
																	<IconButton
																		className="shrink-0"
																		onClick={() =>
																			arrayField.removeValue(index)
																		}
																	>
																		<Trash2 width={15} />
																	</IconButton>
																</Label>
															)}
														/>
													))}
												</div>
											</>
										)}
									/>
								</>
							)
						}
					/>
				</div>
			</section>
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
