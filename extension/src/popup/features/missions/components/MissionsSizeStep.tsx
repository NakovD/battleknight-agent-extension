import { OptionButton } from "@/popup/components/common/form/OptionButton";
import { missionSizeOptions } from "@/popup/features/missions/constants/missionSizeOptions";
import { missionsFormDefaultValues } from "@/popup/features/missions/constants/missionsFormDefaultValues";
import { withMissionsForm } from "@/popup/features/missions/form/missionsContext";

export const MissionsSizeStep = withMissionsForm({
	defaultValues: missionsFormDefaultValues,
	render: ({ form }) => (
		<form.Field
			name="size"
			children={(field) => (
				<div className="grid grid-cols-3 gap-2">
					{missionSizeOptions.map((option) => (
						<OptionButton
							key={option.value}
							label={option.label}
							hint={`${option.defaultCooldownMinutes} min`}
							isSelected={field.state.value === option.value}
							onClick={() => {
								field.handleChange(option.value);
								// A starting point for the next step, not a rule: faster
								// servers come back sooner.
								form.setFieldValue(
									"cooldownMinutes",
									option.defaultCooldownMinutes,
								);
							}}
						/>
					))}
				</div>
			)}
		/>
	),
});
