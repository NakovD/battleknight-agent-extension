import { Tooltip } from "@/popup/components/common/tooltip/Tooltip";
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
			<DuelsOpponentSettings form={form} />

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
