import { Button } from "@/popup/components/common/button/button/Button";
import { DuelsGeneralSettings } from "@/popup/features/duels/components/DuelsGeneralSettings";
import { DuelsOpponentSettings } from "@/popup/features/duels/components/DuelsOpponentSettings";
import { DuelsOrderSettings } from "@/popup/features/duels/components/DuelsOrderSettings";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { useDuelsForm } from "@/popup/features/duels/form/duelsContext";
import type { DuelsForm as DuelsFormType } from "@/popup/features/duels/models/duelsForm";
import { duelsFormValidator } from "@/popup/features/duels/validators/duelsFormValidator";
import { withPreventDefaultAndCb } from "@/popup/utilities/domEventUtility";

interface IDuelsFormProps {
	onSubmit: (values: DuelsFormType) => void;
}

export const DuelsForm = ({ onSubmit }: IDuelsFormProps) => {
	const form = useDuelsForm({
		validators: { onChange: duelsFormValidator },
		defaultValues: duelsFormDefaultValues,
		onSubmit: (form) => onSubmit(form.value),
	});

	return (
		<form
			className="py-3"
			onSubmit={withPreventDefaultAndCb(form.handleSubmit)}
		>
			<DuelsGeneralSettings form={form} />
			<DuelsOpponentSettings form={form} />

			<DuelsOrderSettings form={form} />

			<div className="py-2" />
			<form.Subscribe
				children={(state) => (
					<Button
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
