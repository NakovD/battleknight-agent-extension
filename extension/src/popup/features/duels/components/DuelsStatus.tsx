import { Square } from "lucide-react";
import { formatNumberAdvanced } from "@/popup/utilities/formatUtility";

interface IDuelsSettings {
	levelMin: number;
	levelMax: number;
	lootFilterEnabled: boolean;
	lootMax: number;
	skipAllOrders: boolean;
	skipSpecificOrders: boolean;
	ordersToSkip: string[];
}

interface IDuelsStatusProps {
	settings: IDuelsSettings;
	onStop: () => void;
}

export const DuelsStatus = ({ settings, onStop }: IDuelsStatusProps) => (
	<div className="flex flex-col gap-4 p-4">
		<div className="flex items-center gap-2.5">
			<span className="relative flex h-2 w-2">
				<span className="animate-ping absolute inline-flex h-full w-full bg-amber-500/60" />
				<span className="relative inline-flex h-2 w-2 bg-amber-400" />
			</span>
			<span className="text-[11px] uppercase tracking-widest font-serif text-amber-300/80">
				Extension is running
			</span>
		</div>

		<div className="h-px bg-linear-to-r from-transparent via-amber-900/40 to-transparent" />

		<div className="flex flex-col gap-2">
			<p className="text-[10px] uppercase tracking-widest font-serif text-amber-600/60">
				Active settings
			</p>

			<SettingRow
				label="Opponent levels"
				value={`${settings.levelMin} - ${settings.levelMax}`}
			/>

			{settings.lootFilterEnabled && (
				<SettingRow
					label="Max. loot"
					value={`${formatNumberAdvanced(settings.lootMax)} silver`}
				/>
			)}

			<SettingRow
				label="Orders"
				value={
					!settings.skipAllOrders
						? "Dont skip orders"
						: settings.skipSpecificOrders && settings.ordersToSkip.length > 0
							? settings.ordersToSkip.join(", ")
							: "All orders are skipped"
				}
			/>
		</div>

		<div className="h-px bg-linear-to-r from-transparent via-amber-900/40 to-transparent" />

		<button
			type="button"
			onClick={onStop}
			className="relative flex items-center justify-center gap-2 px-4 py-2 text-[11px] uppercase tracking-widest font-serif font-medium border border-red-900/40 bg-stone-950/80 text-red-400/80 hover:text-red-300 hover:border-red-700/50 hover:bg-red-900/10 transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-red-600/40"
		>
			<span className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t border-l border-red-800/40" />
			<span className="pointer-events-none absolute top-0 right-0 w-2 h-2 border-t border-r border-red-800/40" />
			<span className="pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-800/40" />
			<span className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-800/40" />
			<Square size={11} />
			Stop extension
		</button>
	</div>
);

const SettingRow = ({ label, value }: { label: string; value: string }) => (
	<div className="flex items-baseline justify-between gap-4">
		<span className="text-[11px] text-stone-500 shrink-0">{label}</span>
		<span className="text-[11px] text-amber-200/70 text-right">{value}</span>
	</div>
);
