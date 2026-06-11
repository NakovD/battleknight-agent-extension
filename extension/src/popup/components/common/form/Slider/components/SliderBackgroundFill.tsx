import type { ComponentPropsWithRef } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

export const SliderBackgroundFill = ({
	className,
	...rest
}: ComponentPropsWithRef<"div">) => (
	<div
		className={cn(
			"absolute h-1.5 bg-amber-700/60 border-y border-amber-600/30 transition-all duration-100 cursor-pointer rounded",
			className,
		)}
		{...rest}
	/>
);
