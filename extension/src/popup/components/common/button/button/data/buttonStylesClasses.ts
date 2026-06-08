import type { ClassValue } from "clsx";
import type { ButtonStyleType } from "@/popup/components/common/button/button/models/buttonStyleType";

export const buttonStylesClasses: {
	[key in ButtonStyleType]: { button: ClassValue; borders: ClassValue };
} = {
	primary: {
		button:
			"border-amber-900/30 bg-stone-950/80 text-amber-300/80 hover:text-amber-200 hover:border-amber-700/50 hover:bg-amber-900/10 focus-visible:ring-amber-600/40",
		borders: "border-amber-700/40",
	},
	secondary: {
		button:
			"border-stone-800/60 bg-transparent text-stone-500 hover:text-stone-300 hover:border-stone-600/60 focus-visible:ring-stone-600/40",
		borders: "border-stone-700/40",
	},
};
