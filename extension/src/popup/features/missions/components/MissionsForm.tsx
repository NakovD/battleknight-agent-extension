import { Play } from "lucide-react";
import { Button } from "@/popup/components/common/button/button/Button";
import { Stepper } from "@/popup/components/common/stepper/Stepper";
import { MissionsCooldownStep } from "@/popup/features/missions/components/MissionsCooldownStep";
import { MissionsKarmaStep } from "@/popup/features/missions/components/MissionsKarmaStep";
import { MissionsLocationStep } from "@/popup/features/missions/components/MissionsLocationStep";
import { MissionsSizeStep } from "@/popup/features/missions/components/MissionsSizeStep";
import { missionsFormDefaultValues } from "@/popup/features/missions/constants/missionsFormDefaultValues";
import { useMissionsForm } from "@/popup/features/missions/form/missionsContext";
import type { MissionLocationsState } from "@/popup/features/missions/hooks/useMissionLocations";
import type { MissionsForm as MissionsFormType } from "@/popup/features/missions/models/missionsForm";
import { missionsFormValidator } from "@/popup/features/missions/validators/missionsFormValidator";
import { withPreventDefaultAndCb } from "@/popup/utilities/domEventUtility";

interface IMissionsFormProps {
	locationsState: MissionLocationsState;
	onLoadLocations: () => void;
	onSubmit: (values: MissionsFormType) => void;
}

const { shape } = missionsFormValidator;

export const MissionsForm = ({
	locationsState,
	onLoadLocations,
	onSubmit,
}: IMissionsFormProps) => {
	const form = useMissionsForm({
		validators: { onChange: missionsFormValidator },
		defaultValues: missionsFormDefaultValues,
		// Parsed rather than cast: the schema is what narrows location to non-null.
		onSubmit: ({ value }) => onSubmit(missionsFormValidator.parse(value)),
	});

	return (
		<form onSubmit={withPreventDefaultAndCb(form.handleSubmit)}>
			<form.Subscribe
				selector={(state) => state.values}
				children={(values) => (
					<Stepper
						steps={[
							{
								title: "Location",
								// Each step asks its own field's schema, so Next and the
								// submit rules can't drift apart.
								isComplete: shape.location.safeParse(values.location).success,
								content: (
									<MissionsLocationStep
										form={form}
										locationsState={locationsState}
										onLoadLocations={onLoadLocations}
									/>
								),
							},
							{
								title: "Karma",
								isComplete: shape.karma.safeParse(values.karma).success,
								content: <MissionsKarmaStep form={form} />,
							},
							{
								title: "Mission size",
								isComplete: shape.size.safeParse(values.size).success,
								content: <MissionsSizeStep form={form} />,
							},
							{
								title: "Cooldown",
								isComplete: shape.cooldownMinutes.safeParse(
									values.cooldownMinutes,
								).success,
								content: <MissionsCooldownStep form={form} />,
							},
						]}
						finalAction={
							<Button
								type="submit"
								withIcon
								disabled={!missionsFormValidator.safeParse(values).success}
							>
								<Play size={11} />
								Start missions
							</Button>
						}
					/>
				)}
			/>
		</form>
	);
};
