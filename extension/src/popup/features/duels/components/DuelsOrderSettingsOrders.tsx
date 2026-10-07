import { CirclePlus, Trash2 } from "lucide-react";
import { IconButton } from "@/popup/components/common/button/iconButton/IconButton";
import { Input } from "@/popup/components/common/form/Input";
import { Label } from "@/popup/components/common/form/Label";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { withDuelsForm } from "@/popup/features/duels/form/duelsContext";
import { firstErrorMessage } from "@/popup/utilities/formErrorUtility";

export const DuelsOrderSettingsOrders = withDuelsForm({
	defaultValues: duelsFormDefaultValues,
	render: ({ form }) => (
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
										aria-label="Add order"
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
												name={`specificOrders[${index}].name`}
												children={(subfield) => (
													<Label
														className="flex items-center gap-4"
														htmlFor={`specificOrders[${index}]`}
													>
														<Input
															id={`specificOrders[${index}]`}
															placeholder="Order name..."
															value={subfield.state.value}
															onChange={(e) =>
																subfield.setValue(e.target.value)
															}
															// Shown without waiting for a blur: the row exists
															// because the user added it, and an empty one already
															// disables Start — so the reason has to be on screen.
															error={firstErrorMessage(
																subfield.state.meta.errors,
															)}
														/>
														<IconButton
															aria-label={`Remove order ${index + 1}`}
															className="shrink-0"
															onClick={() => arrayField.removeValue(index)}
														>
															<Trash2 width={15} />
														</IconButton>
													</Label>
												)}
											/>
										))}
									</div>

									{firstErrorMessage(arrayField.state.meta.errors) && (
										<p
											role="alert"
											className="pt-2 text-[10px] text-red-500/80"
										>
											{firstErrorMessage(arrayField.state.meta.errors)}
										</p>
									)}
								</>
							)}
						/>
					</>
				)
			}
		/>
	),
});
