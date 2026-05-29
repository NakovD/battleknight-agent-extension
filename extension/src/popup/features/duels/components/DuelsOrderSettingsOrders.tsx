import { CirclePlus, Trash2 } from "lucide-react";
import { IconButton } from "@/popup/components/common/button/iconButton/IconButton";
import { Input } from "@/popup/components/common/form/Input";
import { Label } from "@/popup/components/common/form/Label";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { withDuelsForm } from "@/popup/features/duels/form/duelsContext";

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
															onClick={() => arrayField.removeValue(index)}
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
	),
});
