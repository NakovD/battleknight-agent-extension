import { Map as MapIcon, RotateCcw } from "lucide-react";
import { Button } from "@/popup/components/common/button/button/Button";
import { OptionButton } from "@/popup/components/common/form/OptionButton";
import { missionsFormDefaultValues } from "@/popup/features/missions/constants/missionsFormDefaultValues";
import { missionsUnavailableMessages } from "@/popup/features/missions/constants/missionsUnavailableMessages";
import { withMissionsForm } from "@/popup/features/missions/form/missionsContext";
import type { MissionLocationsState } from "@/popup/features/missions/hooks/useMissionLocations";

export const MissionsLocationStep = withMissionsForm({
	defaultValues: missionsFormDefaultValues,
	props: {} as {
		locationsState: MissionLocationsState;
		onLoadLocations: () => void;
	},
	render: ({ form, locationsState, onLoadLocations }) => {
		const isLoading = locationsState.status === "loading";
		const hasLoaded = locationsState.status === "loaded";

		return (
			<div className="flex flex-col gap-4">
				<p className="text-[11px] text-stone-500 leading-relaxed">
					Reads the city your knight is in from the world map, along with the
					locations you can do missions in.
				</p>

				<Button
					onClick={() => {
						// A reload may come back with another city, where the old pick
						// would mean nothing.
						form.setFieldValue("location", null);
						onLoadLocations();
					}}
					disabled={isLoading}
					withIcon
					styleType={hasLoaded ? "secondary" : "primary"}
				>
					{hasLoaded ? <RotateCcw size={11} /> : <MapIcon size={11} />}
					{isLoading
						? "Loading locations..."
						: hasLoaded
							? "Reload locations"
							: "Load locations"}
				</Button>

				{locationsState.status === "unavailable" && (
					<p role="alert" className="text-[11px] text-amber-500/80">
						{missionsUnavailableMessages[locationsState.reason]}
					</p>
				)}

				{locationsState.status === "loaded" && (
					<form.Field
						name="location"
						children={(field) => (
							<div className="flex flex-col gap-2">
								<p className="text-[10px] uppercase tracking-widest font-serif text-amber-600/60">
									{locationsState.city}
								</p>

								{locationsState.locations.length === 0 ? (
									<p className="text-[11px] text-stone-500">
										There are no mission locations in this city.
									</p>
								) : (
									<div className="grid grid-cols-2 gap-2">
										{locationsState.locations.map((location) => (
											<OptionButton
												key={location.id}
												label={location.name}
												isSelected={field.state.value?.id === location.id}
												onClick={() => field.handleChange(location)}
											/>
										))}
									</div>
								)}
							</div>
						)}
					/>
				)}
			</div>
		);
	},
});
