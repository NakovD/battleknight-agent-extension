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
	/** Settings restored from the signed-in account, if any. */
	defaultValues?: DuelsFormType;
}

export const DuelsForm = ({ onSubmit, defaultValues }: IDuelsFormProps) => {
	const form = useDuelsForm({
		validators: { onChange: duelsFormValidator },
		defaultValues: defaultValues ?? duelsFormDefaultValues,
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
					// Not gated on isDirty: settings restored from an account are ready to
					// start as they are, without the user having to change something first.
					<Button type="submit" disabled={!state.isFieldsValid}>
						Start extension
					</Button>
				)}
			/>
		</form>
	);
};
