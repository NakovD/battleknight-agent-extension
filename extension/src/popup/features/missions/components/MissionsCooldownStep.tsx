import { Input } from "@/popup/components/common/form/Input";
import { Label } from "@/popup/components/common/form/Label";
import { missionsFormDefaultValues } from "@/popup/features/missions/constants/missionsFormDefaultValues";
import { withMissionsForm } from "@/popup/features/missions/form/missionsContext";
import { firstErrorMessage } from "@/popup/utilities/formErrorUtility";

export const MissionsCooldownStep = withMissionsForm({
	defaultValues: missionsFormDefaultValues,
	render: ({ form }) => (
		<form.Field
			name="cooldownMinutes"
			children={(field) => (
				<Label htmlFor="missions-cooldown" className="flex flex-col gap-3">
					Cooldown between missions (minutes)
					<Input
						id="missions-cooldown"
						type="number"
						inputMode="numeric"
						min={1}
						step={1}
						// An emptied input is NaN in the form; React wants "" for that.
						value={
							Number.isNaN(field.state.value) ? "" : String(field.state.value)
						}
						onChange={(e) => field.handleChange(e.target.valueAsNumber)}
						hint="Standard servers: 10 / 20 / 30 min. Faster servers return sooner."
						error={firstErrorMessage(field.state.meta.errors)}
					/>
				</Label>
			)}
		/>
	),
});
