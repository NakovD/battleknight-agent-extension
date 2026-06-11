import type { ComponentPropsWithRef, ReactNode } from "react";
import { buttonStylesClasses } from "@/popup/components/common/button/button/data/buttonStylesClasses";
import type { ButtonStyleType } from "@/popup/components/common/button/button/models/buttonStyleType";
import { cn } from "@/popup/utilities/tailwindUtility";

interface IButtonProps
	extends Omit<ComponentPropsWithRef<"button">, "children"> {
	children: ReactNode;
	styleType?: ButtonStyleType;
	withIcon?: boolean;
}

export const Button = ({
	children,
	className,
	type = "button",
	styleType = "primary",
	withIcon = false,
	...rest
}: IButtonProps) => (
	<button
		type={type}
		className={cn(
			buttonStylesClasses[styleType].button,
			withIcon && "flex items-center justify-center gap-2",
			"relative px-4 py-2 text-[11px] cursor-pointer uppercase tracking-widest font-serif font-medium border transition-all duration-150 outline-none focus-visible:ring-1 disabled:opacity-30 disabled:cursor-not-allowed",
			className,
		)}
		{...rest}
	>
		<span
			className={`pointer-events-none absolute top-0 left-0 w-2 h-2 border-t border-l ${buttonStylesClasses[styleType].borders}`}
		/>
		<span
			className={`pointer-events-none absolute top-0 right-0 w-2 h-2 border-t border-r ${buttonStylesClasses[styleType].borders}`}
		/>
		<span
			className={`pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b border-l ${buttonStylesClasses[styleType].borders}`}
		/>
		<span
			className={`pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b border-r ${buttonStylesClasses[styleType].borders}`}
		/>
		{children}
	</button>
);
