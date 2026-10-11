import { useEffect, useRef, useState } from "react";

/** Long enough to read as a fade, short enough not to slow the form down. */
export const STEP_FADE_MS = 150;

/**
 * Tracks which step is shown and fades between them: the current step fades
 * out, the next one replaces it while invisible, then fades in.
 */
export const useStepper = (stepCount: number) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [isFading, setIsFading] = useState(false);
	const fadeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
		},
		[],
	);

	const goTo = (target: number) => {
		// Ignored mid-fade, so a second click can't queue another swap behind the
		// first one and make the step flicker.
		if (isFading || target === currentStep) return;
		if (target < 0 || target >= stepCount) return;

		setIsFading(true);
		fadeTimeout.current = setTimeout(() => {
			setCurrentStep(target);
			setIsFading(false);
		}, STEP_FADE_MS);
	};

	return {
		currentStep,
		isFading,
		isFirstStep: currentStep === 0,
		isLastStep: currentStep === stepCount - 1,
		next: () => goTo(currentStep + 1),
		previous: () => goTo(currentStep - 1),
	};
};
