import { Square } from "lucide-react";
import type {
	MissionsState,
	MissionsWait,
} from "@/common/features/missions/models/missionsState";
import { Button } from "@/popup/components/common/button/button/Button";
import { missionSizeOptions } from "@/popup/features/missions/constants/missionSizeOptions";
import { useCountdown } from "@/popup/hooks/useCountdown";
import {
	formatDuration,
	formatNumberAdvanced,
} from "@/popup/utilities/formatUtility";

interface IMissionsStatusProps {
	state: MissionsState;
	onStop: () => void;
}

const waitLabels: Record<MissionsWait["reason"], string> = {
	returning: "Next mission in",
	"hit-points": "Waiting for hit points. Checking again in",
	retry: "Checking the game again in",
};

export const MissionsStatus = ({ state, onStop }: IMissionsStatusProps) => {
	const { settings, wait, lastMission, run } = state;
	const remainingMs = useCountdown(wait?.until ?? null);

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-2.5">
				<span className="relative flex h-2 w-2">
					<span className="animate-ping absolute inline-flex h-full w-full bg-amber-500/60" />
					<span className="relative inline-flex h-2 w-2 bg-amber-400" />
				</span>
				<span className="text-[11px] uppercase tracking-widest font-serif text-amber-300/80">
					Missions are running
				</span>
			</div>

			<p role="status" className="text-[11px] text-amber-200/80">
				{wait && remainingMs !== null
					? `${waitLabels[wait.reason]} ${formatDuration(remainingMs)}`
					: "On a mission..."}
			</p>

			<Divider />

			{settings && (
				<Section title="Missions">
					<SettingRow
						label="Location"
						value={`${settings.location.name}, ${settings.city}`}
					/>
					<SettingRow
						label="Mission"
						value={`${sizeLabel(settings.size)}, ${settings.karma} karma`}
					/>
				</Section>
			)}

			{lastMission && (
				<Section title="Last mission">
					<SettingRow label="Location" value={lastMission.location.name} />
					<SettingRow
						label="Result"
						value={
							lastMission.won
								? `Won${lastMission.opponent.name ? ` against ${lastMission.opponent.name}` : ""}`
								: `Lost${lastMission.opponent.name ? ` to ${lastMission.opponent.name}` : ""}`
						}
					/>
					{lastMission.silver !== null && (
						<SettingRow
							label="Silver"
							value={formatNumberAdvanced(lastMission.silver)}
						/>
					)}
				</Section>
			)}

			<Section title="Since start">
				<SettingRow label="Missions" value={String(run.missions)} />
				<SettingRow label="Won / lost" value={`${run.wins} / ${run.losses}`} />
				<SettingRow label="Silver" value={formatNumberAdvanced(run.silver)} />
			</Section>

			<Divider />

			<Button onClick={onStop} withIcon styleType="secondary">
				<Square size={11} />
				Stop missions
			</Button>
		</div>
	);
};

const sizeLabel = (size: string) =>
	missionSizeOptions.find((option) => option.value === size)?.label ?? size;

const Divider = () => (
	<div className="h-px bg-linear-to-r from-transparent via-amber-900/40 to-transparent" />
);

const Section = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<div className="flex flex-col gap-2">
		<p className="text-[10px] uppercase tracking-widest font-serif text-amber-600/60">
			{title}
		</p>
		{children}
	</div>
);

const SettingRow = ({ label, value }: { label: string; value: string }) => (
	<div className="flex items-baseline justify-between gap-4">
		<span className="text-[11px] text-stone-500 shrink-0">{label}</span>
		<span className="text-[11px] text-amber-200/70 text-right">{value}</span>
	</div>
);
