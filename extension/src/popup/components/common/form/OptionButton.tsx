import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface IOptionButtonProps
	extends Omit<ComponentPropsWithRef<"button">, "children"> {
	isSelected: boolean;
	label: ReactNode;
	hint?: ReactNode;
}

/** One choice out of several, shown as a button that stays pressed when picked. */
export const OptionButton = ({
	isSelected,
	label,
	hint,
	className,
	type = "button",
	...rest
}: IOptionButtonProps) => (
	<button
		type={type}
		aria-pressed={isSelected}
		className={cn(
			"relative flex flex-col items-start gap-0.5 px-3 py-2 text-left cursor-pointer",
			"border transition-all duration-150 outline-none",
			"focus-visible:ring-1 focus-visible:ring-amber-600/40",
			"disabled:opacity-30 disabled:cursor-not-allowed",
			isSelected
				? "border-amber-700/70 bg-amber-900/20 shadow-[0_0_6px_rgba(217,119,6,0.25)]"
				: "border-stone-800/60 bg-stone-950/80 hover:border-amber-900/50 hover:bg-amber-900/5",
			className,
		)}
		{...rest}
	>
		<span className="pointer-events-none absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-700/40" />
		<span className="pointer-events-none absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-700/40" />

		<span
			className={cn(
				"text-[11px] uppercase tracking-widest font-serif font-medium",
				isSelected ? "text-amber-200" : "text-stone-400",
			)}
		>
			{label}
		</span>
		{hint && <span className="text-[10px] text-stone-500">{hint}</span>}
	</button>
);
