import { Dropdown } from "@/popup/components/common/form/Dropdown";
import { Label } from "@/popup/components/common/form/Label";
import { Heading } from "@/popup/components/common/headings/Heading";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { duelsFormPagesOptions } from "@/popup/features/duels/constants/duelsFormPagesOptions";
import { withDuelsForm } from "@/popup/features/duels/form/duelsContext";

export const DuelsGeneralSettings = withDuelsForm({
	defaultValues: duelsFormDefaultValues,
	render: ({ form }) => (
		<section className="border-none border-amber-700/50">
			<Heading>General</Heading>
			<div className="pb-5" />
			<form.AppField
				name="page"
				children={(field) => (
					<Label>
						Page
						<Dropdown
							value={field.state.value}
							onChange={field.handleChange}
							options={duelsFormPagesOptions}
						/>
					</Label>
				)}
			/>
			<div className="pb-5" />
		</section>
	),
});
