import { Button } from "@/popup/components/common/button/button/Button";
import { Tooltip } from "@/popup/components/common/tooltip/Tooltip";
import { DuelsGeneralSettings } from "@/popup/features/duels/components/DuelsGeneralSettings";
import { DuelsOpponentSettings } from "@/popup/features/duels/components/DuelsOpponentSettings";
import { DuelsOrderSettings } from "@/popup/features/duels/components/DuelsOrderSettings";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { useDuelsForm } from "@/popup/features/duels/form/duelsContext";
import { duelsFormValidator } from "@/popup/features/duels/validators/duelsFormValidator";
import { withPreventDefaultAndCb } from "@/popup/utilities/domEventUtility";

export const Duels = () => {
	const form = useDuelsForm({
		validators: { onChange: duelsFormValidator },
		defaultValues: duelsFormDefaultValues,
		onSubmit: (values) => {
			console.log(values);
		},
	});

	return (
		<form
			className="py-3"
			onSubmit={withPreventDefaultAndCb(form.handleSubmit)}
		>
			<DuelsGeneralSettings form={form} />
			<DuelsOpponentSettings form={form} />

			<DuelsOrderSettings form={form} />

			<Tooltip id="submit-button-tooltip" popover="auto">
				<p>Some tooltip content</p>
			</Tooltip>
			<div className="py-2" />
			<form.Subscribe
				children={(state) => (
					<Button
						popoverTarget="submit-button-tooltip"
						type="submit"
						disabled={!(state.isFieldsValid && state.isDirty)}
					>
						Start extension
					</Button>
				)}
			/>
		</form>
	);
};
