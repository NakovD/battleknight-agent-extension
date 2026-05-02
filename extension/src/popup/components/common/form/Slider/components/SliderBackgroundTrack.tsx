import type { ComponentPropsWithRef } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface ISliderTrackBackgroundProps extends ComponentPropsWithRef<"div"> {}

export const SliderTrackBackground = ({
	className,
	...props
}: ISliderTrackBackgroundProps) => (
	<div
		className={cn(
			"absolute inset-x-0 h-1.5 bg-stone-800 border border-stone-700/40 cursor-pointer rounded",
			className,
		)}
		{...props}
	/>
);
