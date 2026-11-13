import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/popup/components/common/button/button/Button";
import { Heading } from "@/popup/components/common/headings/Heading";
import { StepIndicator } from "@/popup/components/common/stepper/components/StepIndicator";
import {
	STEP_FADE_MS,
	useStepper,
} from "@/popup/components/common/stepper/hooks/useStepper";
import { cn } from "@/popup/utilities/tailwindUtility";

export interface IStep {
	title: string;
	content: ReactNode;
	/** Next stays disabled until the step has what it needs. */
	isComplete: boolean;
}

interface IStepperProps {
	steps: IStep[];
	/** Rendered in place of Next on the last step — usually the submit button. */
	finalAction: ReactNode;
}

/**
 * Shows one step at a time instead of the whole form, so the popup never needs
 * scrolling.
 */
export const Stepper = ({ steps, finalAction }: IStepperProps) => {
	const { currentStep, isFading, isFirstStep, isLastStep, next, previous } =
		useStepper(steps.length);

	const step = steps[currentStep];

	return (
		<div className="flex flex-col gap-5 py-3">
			<StepIndicator current={currentStep} total={steps.length} />

			<div
				className={cn(
					"flex flex-col gap-5 transition-opacity motion-reduce:transition-none",
					isFading ? "opacity-0" : "opacity-100",
				)}
				// Inline, so the CSS and the timeout that swaps the step share one value.
				style={{ transitionDuration: `${STEP_FADE_MS}ms` }}
			>
				<Heading subtitle={`Step ${currentStep + 1} of ${steps.length}`}>
					{step.title}
				</Heading>
				{step.content}
			</div>

			<div className="flex gap-2">
				<Button
					onClick={previous}
					disabled={isFirstStep || isFading}
					withIcon
					styleType="secondary"
					className="flex-1"
				>
					<ChevronLeft size={11} />
					Previous
				</Button>

				{isLastStep ? (
					<div className="flex-1 flex flex-col">{finalAction}</div>
				) : (
					<Button
						onClick={next}
						disabled={!step.isComplete || isFading}
						withIcon
						className="flex-1"
					>
						Next
						<ChevronRight size={11} />
					</Button>
				)}
			</div>
		</div>
	);
};
