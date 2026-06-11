import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/popup/components/common/button/button/Button";

interface IDuelsErrorProps {
	message: string | null;
	onRetry?: () => void;
	onBack: () => void;
}

export const DuelsError = ({ message, onRetry, onBack }: IDuelsErrorProps) => {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-2.5">
				<span className="relative flex h-2 w-2 shrink-0">
					<span className="relative inline-flex h-2 w-2 bg-red-500" />
				</span>
				<span className="text-[11px] uppercase tracking-widest font-serif text-red-400/80">
					An error occurred
				</span>
			</div>

			<div className="h-px bg-linear-to-r from-transparent via-red-900/30 to-transparent" />

			<div className="relative px-3 py-2.5 border border-red-900/30 bg-red-950/20">
				<span className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t border-l border-red-800/40" />
				<span className="pointer-events-none absolute top-0 right-0 w-2 h-2 border-t border-r border-red-800/40" />
				<span className="pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-800/40" />
				<span className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-800/40" />
				<p className="text-[11px] text-red-300/70 leading-relaxed">
					{message ?? "An unknown error occurred. Please try again."}
				</p>
			</div>

			<div className="h-px bg-linear-to-r from-transparent via-red-900/30 to-transparent" />

			<div className="flex flex-col gap-2">
				{onRetry && (
					<Button onClick={onRetry} withIcon>
						<RotateCcw size={11} />
						Try again
					</Button>
				)}

				<Button onClick={onBack} withIcon styleType="secondary">
					<ArrowLeft size={11} />
					Go back
				</Button>
			</div>
		</div>
	);
};
