import type { ComponentPropsWithRef } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface ILabelProps extends ComponentPropsWithRef<"label"> {
	children: React.ReactNode;
}

export const Label = ({ className, children, ...rest }: ILabelProps) => (
	// biome-ignore lint/a11y/noLabelWithoutControl: <explanation>Label is used as a wrapper for the input, so it will always have a control.</explanation>
	<label
		className={cn(
			"text-[10px] uppercase tracking-widest font-medium text-amber-600/70 font-serif",
			className,
		)}
		{...rest}
	>
		{children}
	</label>
);
