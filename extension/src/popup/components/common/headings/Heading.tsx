import type { ReactNode } from "react";

interface HeadingProps {
	children: ReactNode;
	subtitle?: string;
}

export const Heading = ({ children, subtitle }: HeadingProps) => (
	<div className="relative flex flex-col items-center gap-1 py-3 px-4">
		<div className="absolute top-0 inset-x-4 h-px bg-linear-to-r from-transparent via-amber-700/50 to-transparent" />

		<span className="absolute top-1.5 left-3 w-2.5 h-2.5 border-t border-l border-amber-700/50" />
		<span className="absolute top-1.5 right-3 w-2.5 h-2.5 border-t border-r border-amber-700/50" />

		<h1 className="font-serif uppercase tracking-[0.2em] text-sm font-medium text-amber-300/90">
			{children}
		</h1>

		{subtitle && (
			<p className="text-[10px] tracking-widest text-stone-500 uppercase">
				{subtitle}
			</p>
		)}

		<div className="absolute bottom-0 inset-x-4 h-px bg-linear-to-r from-transparent via-amber-700/50 to-transparent" />
	</div>
);
