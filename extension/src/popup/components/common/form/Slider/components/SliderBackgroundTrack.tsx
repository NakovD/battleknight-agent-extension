import type { ComponentPropsWithRef } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface ISliderTrackBackgroundProps extends ComponentPropsWithRef<"div"> {}

export const SliderTrackBackground = ({
	className,
	...props
}: ISliderTrackBackgroundProps) => (
	<div
		className={cn(
			"absolute inset-x-0 h-0.75 bg-stone-800 border border-stone-700/40",
			className,
		)}
		{...props}
	/>
);
