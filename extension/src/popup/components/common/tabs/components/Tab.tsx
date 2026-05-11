import type { ReactNode } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface ITabProps {
	id: string;
	isActive: boolean;
	label: ReactNode;
	icon?: ReactNode;
	disabled?: boolean;
	onClick: () => void;
}

export const Tab = ({
	id,
	isActive,
	label,
	icon,
	disabled,
	onClick,
}: ITabProps) => (
	<button
		type="button"
		role="tab"
		aria-selected={isActive}
		aria-controls={`tabpanel-${id}`}
		disabled={disabled}
		onClick={() => !disabled && onClick()}
		className={cn(
			"relative flex items-center gap-1.5 px-4 py-2.5",
			"text-[11px] uppercase tracking-widest font-serif font-medium",
			"transition-colors duration-150 outline-none",
			"focus-visible:ring-1 focus-visible:ring-amber-600/40 focus-visible:ring-inset",
			"disabled:opacity-30 disabled:cursor-not-allowed",
			isActive && "text-amber-300",
			!isActive && "text-stone-500 hover:text-stone-300",
		)}
	>
		{icon && (
			<span
				className={cn(
					isActive && "text-amber-400",
					!isActive && "text-stone-600",
				)}
			>
				{icon}
			</span>
		)}

		{label}

		{isActive && (
			<>
				<span className="absolute bottom-0 inset-x-0 h-px bg-amber-600/70" />
				<span className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-amber-700/50 pointer-events-none" />
				<span className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-amber-700/50 pointer-events-none" />
			</>
		)}
	</button>
);
