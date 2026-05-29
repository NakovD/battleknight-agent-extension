import { Label } from "@/popup/components/common/form/Label";
import { Toggle } from "@/popup/components/common/form/Toggle";
import { Heading } from "@/popup/components/common/headings/Heading";
import { DuelsOrderSettingsOrders } from "@/popup/features/duels/components/DuelsOrderSettingsOrders";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { withDuelsForm } from "@/popup/features/duels/form/duelsContext";

export const DuelsOrderSettings = withDuelsForm({
	defaultValues: duelsFormDefaultValues,
	render: ({ form }) => (
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
				<DuelsOrderSettingsOrders form={form} />
			</div>
		</section>
	),
});
