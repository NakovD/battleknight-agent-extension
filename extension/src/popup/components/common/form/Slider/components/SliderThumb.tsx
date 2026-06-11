import type { ComponentPropsWithRef } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

interface ISliderThumbProps
	extends Omit<ComponentPropsWithRef<"div">, "children"> {
	position: number;
	disabled?: boolean;
	thumbValue: number;
	formatLabel: (value: number) => string;
	thumbInnerColorClassName?: string;
}

export const SliderThumb = ({
	disabled,
	position,
	thumbValue,
	style,
	className,
	formatLabel,
	thumbInnerColorClassName = "bg-amber-500",
	...rest
}: ISliderThumbProps) => (
	<div
		className={cn(
			"absolute w-3.5 h-3.5 -translate-x-1/2 cursor-pointer flex justify-center",
			"border border-amber-500/80 bg-stone-950",
			"shadow-[0_0_6px_rgba(217,119,6,0.35)]",
			disabled ? "opacity-40" : "",
			className,
		)}
		style={{ left: `${position}%`, ...style }}
		{...rest}
	>
		<span className="absolute inset-0 flex items-center justify-center">
			<span className={cn("w-1 h-1", thumbInnerColorClassName)} />
		</span>

		<p className="relative bottom-7 text-base">{formatLabel(thumbValue)}</p>
	</div>
);
