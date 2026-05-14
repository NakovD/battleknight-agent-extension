import type { ComponentPropsWithRef, ReactNode } from "react";
import { TooltipArrow } from "@/popup/components/common/tooltip/components/TooltipArrow";

interface ITooltipProps extends ComponentPropsWithRef<"div"> {
	children: ReactNode;
	arrow?: "top" | "bottom" | "left" | "right";
}

export const Tooltip = ({ children, arrow, ...rest }: ITooltipProps) => {
	return (
		<div
			className="absolute [position-area:top] [position-try-fallbacks:flip-block]"
			{...rest}
		>
			{arrow === "top" && <TooltipArrow direction="top" />}

			<div className="relative px-3 py-2 bg-stone-950 border border-amber-900/40 text-amber-100/80 text-[11px] leading-snug max-w-45">
				<span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-600/40 pointer-events-none" />
				<span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-600/40 pointer-events-none" />
				<span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-600/40 pointer-events-none" />
				<span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-600/40 pointer-events-none" />

				{children}
			</div>

			{arrow === "bottom" && <TooltipArrow direction="bottom" />}

			{arrow === "left" && <TooltipArrow direction="left" />}

			{arrow === "right" && <TooltipArrow direction="right" />}
		</div>
	);
};
