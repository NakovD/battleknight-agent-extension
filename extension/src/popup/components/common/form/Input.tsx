import type { ComponentPropsWithRef } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface IInputProps extends ComponentPropsWithRef<"input"> {
	hint?: string;
	error?: string;
	// Add any custom props here if needed, e.g., label?: string;
}

export const Input = ({ className, hint, error, ...rest }: IInputProps) => (
	<div className="flex flex-col gap-1 w-full">
		<div className="relative">
			<span className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-700/40" />
			<span className="pointer-events-none absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-700/40" />
			<span className="pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-700/40" />
			<span className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-700/40" />

			<input
				className={cn(
					"w-full bg-stone-950/80 text-amber-100/90 text-sm",
					"px-3 py-2",
					"border border-amber-900/30",
					"placeholder:text-stone-600",
					"outline-none",
					"transition-all duration-150",
					"focus:border-amber-700/60 focus:bg-stone-900/90",
					"disabled:opacity-40 disabled:cursor-not-allowed",
					error ? "border-red-800/60 focus:border-red-700/80" : "",
					className,
				)}
				{...rest}
			/>
		</div>

		{hint && !error && <p className="text-[10px] text-stone-500">{hint}</p>}
		{error && <p className="text-[10px] text-red-500/80">{error}</p>}
	</div>
);
