import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface IButtonProps
	extends Omit<ComponentPropsWithRef<"button">, "children"> {
	children: ReactNode;
}

export const Button = ({
	children,
	className,
	type = "button",
	...rest
}: IButtonProps) => (
	<button
		type={type}
		className={cn(
			"relative px-4 py-2 text-[11px] cursor-pointer uppercase tracking-widest font-serif font-medium border border-amber-900/30 bg-stone-950/80 text-amber-300/80 hover:text-amber-200 hover:border-amber-700/50 hover:bg-amber-900/10 transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-amber-600/40 disabled:opacity-30 disabled:cursor-not-allowed",
			className,
		)}
		{...rest}
	>
		<span className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-700/40" />
		<span className="pointer-events-none absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-700/40" />
		<span className="pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-700/40" />
		<span className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-700/40" />
		{children}
	</button>
);
