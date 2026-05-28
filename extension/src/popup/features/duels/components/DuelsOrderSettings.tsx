import { CirclePlus, Heading, Trash2 } from "lucide-react";
import { IconButton } from "@/popup/components/common/button/iconButton/IconButton";
import { Input } from "@/popup/components/common/form/Input";
import { Label } from "@/popup/components/common/form/Label";
import { Toggle } from "@/popup/components/common/form/Toggle";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { withDuelsForm } from "@/popup/features/duels/form/duelsContext";

export const DuelsOrderSettings = withDuelsForm({
	defaultValues: duelsFormDefaultValues,
	render: function Render({ form }) {
		return (
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
		);
	},
});
