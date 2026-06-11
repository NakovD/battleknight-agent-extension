import type { ComponentPropsWithRef } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface IToggleProps
	extends Omit<ComponentPropsWithRef<"input">, "value" | "className"> {
	value: boolean;
	hint?: string;
	error?: string;
}

export const Toggle = ({
	hint,
	error,
	disabled,
	value,
	...rest
}: IToggleProps) => (
	<div className="flex flex-col gap-1 w-full">
		<div
			className={cn(
				"relative shrink-0 w-9 h-5 rounded-none",
				"border transition-all duration-200 outline-none",
				"focus-visible:ring-1 focus-visible:ring-amber-600/50 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-950",
				"disabled:opacity-40 disabled:cursor-not-allowed",
				value
					? "bg-amber-900/60 border-amber-700/70"
					: "bg-stone-900 border-stone-700/50",
			)}
		>
			<input type="checkbox" className="sr-only" {...rest} />
			<span className="pointer-events-none absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-600/30" />
			<span className="pointer-events-none absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-amber-600/30" />
			<span className="pointer-events-none absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-amber-600/30" />
			<span className="pointer-events-none absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-600/30" />

			<span
				className={cn(
					"absolute top-0.5 w-3.5 h-3.5",
					"transition-all duration-200",
					"border",
					value
						? "left-[calc(100%-18px)] bg-amber-500 border-amber-400/80 shadow-[0_0_6px_rgba(217,119,6,0.5)]"
						: "left-0.5 bg-stone-500 border-stone-400/40",
				)}
			/>
		</div>

		{hint && !error && <p className="text-[10px] text-stone-500">{hint}</p>}
		{error && <p className="text-[10px] text-red-500/80">{error}</p>}
	</div>
);
