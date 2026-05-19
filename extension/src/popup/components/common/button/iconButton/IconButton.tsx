import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface IIconButtonProps
	extends Omit<ComponentPropsWithRef<"button">, "children"> {
	children: ReactNode;
}

export const IconButton = ({
	className,
	type = "button",
	children,
	...rest
}: IIconButtonProps) => (
	<button
		type={type}
		className={cn(
			"relative flex items-center justify-center w-7 h-7 border border-amber-900/30 bg-stone-950/80 text-amber-700/70 hover:text-amber-300 hover:border-amber-700/50 hover:bg-stone-900/80 transition-all duration-150 outline-none cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-600/40 disabled:opacity-30 disabled:cursor-not-allowed",
			className,
		)}
		{...rest}
	>
		{children}
	</button>
);
