import { Label } from "@/popup/components/common/form/Label";
import { Toggle } from "@/popup/components/common/form/Toggle";
import { missionsFormDefaultValues } from "@/popup/features/missions/constants/missionsFormDefaultValues";
import { withMissionsForm } from "@/popup/features/missions/form/missionsContext";
import { cn } from "@/popup/utilities/tailwindUtility";

export const MissionsKarmaStep = withMissionsForm({
	defaultValues: missionsFormDefaultValues,
	render: ({ form }) => (
		<form.Field
			name="karma"
			children={(field) => {
				const isDark = field.state.value === "dark";

				return (
					<Label
						htmlFor="missions-karma"
						className="flex items-center justify-center gap-4 py-4 cursor-pointer"
					>
						<span className={cn(isDark ? "text-stone-600" : "text-amber-300")}>
							Light
						</span>
						<div className="w-auto">
							<Toggle
								id="missions-karma"
								aria-label="Dark karma"
								value={isDark}
								onChange={() => field.handleChange(isDark ? "light" : "dark")}
							/>
						</div>
						<span className={cn(isDark ? "text-amber-300" : "text-stone-600")}>
							Dark
						</span>
					</Label>
				);
			}}
		/>
	),
});
