import { cn } from "@/popup/utilities/tailwindUtility";

interface IStepIndicatorProps {
	current: number;
	total: number;
}

export const StepIndicator = ({ current, total }: IStepIndicatorProps) => (
	<div className="flex gap-1.5" aria-hidden="true">
		{Array.from({ length: total }, (_, index) => (
			<span
				// The steps are a fixed sequence, so the index is a stable key.
				// biome-ignore lint/suspicious/noArrayIndexKey: see above
				key={index}
				className={cn(
					"h-0.5 flex-1 transition-colors duration-200",
					index <= current ? "bg-amber-600/70" : "bg-stone-800",
				)}
			/>
		))}
	</div>
);
