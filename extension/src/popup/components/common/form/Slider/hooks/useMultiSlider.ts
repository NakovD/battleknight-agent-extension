import { type ComponentRef, useRef, useState } from "react";

type CalculateValueParams = {
	clientX: number;
	valueServed: "lower" | "upper";
	lowValue: number;
	topValue: number;
};

interface IUseMultiSliderOptions {
	lowerValue: number;
	upperValue: number;
	min: number;
	max: number;
	step: number;
	disabled?: boolean;
	onChange: (lowerValue: number, upperValue: number) => void;
}

export const useMultiSlider = ({
	lowerValue,
	upperValue,
	min,
	max,
	step,
	disabled,
	onChange,
}: IUseMultiSliderOptions) => {
	const [minValue, setMinValue] = useState(lowerValue);
	const [maxValue, setMaxValue] = useState(upperValue);

	const bgRef = useRef<ComponentRef<"div">>(null);

	const firstHandlePosition = calculateHandlePositionPercentage(
		minValue,
		min,
		max,
	);

	const secondHandlePosition = calculateHandlePositionPercentage(
		maxValue,
		min,
		max,
	);

	const calculateNewHandlePosition = (clientX: number) => {
		if (!bgRef.current) return undefined;

		const rect = bgRef.current.getBoundingClientRect();

		const width = rect.width;

		const offsetX = Math.min(Math.max(0, clientX - rect.left), width);

		const percentage = offsetX / width;

		const rawValue = percentage * (max - min) + min;

		const steppedValue = Math.round(rawValue / step) * step;

		return steppedValue;
	};

	const updateHandlePosition = ({
		clientX,
		lowValue,
		topValue,
		valueServed,
	}: CalculateValueParams) => {
		const newHandlePosition = calculateNewHandlePosition(clientX);

		if (newHandlePosition === undefined) return;

		const shouldUpdate = getShouldUpdate(
			newHandlePosition,
			lowValue,
			topValue,
			min,
			max,
			valueServed,
		);

		if (!shouldUpdate) return;

		if (valueServed === "lower") {
			onChange(newHandlePosition, maxValue);
			return setMinValue(newHandlePosition);
		}

		setMaxValue(newHandlePosition);
		onChange(minValue, newHandlePosition);
	};

	const handleTrackClick = (clientX: number) => {
		if (disabled) return;

		const newHandlePosition = calculateNewHandlePosition(clientX);

		if (newHandlePosition === undefined) return;

		const distToMin = Math.abs(newHandlePosition - minValue);
		const distToMax = Math.abs(newHandlePosition - maxValue);

		if (distToMin < distToMax) {
			setMinValue(newHandlePosition);
			onChange(newHandlePosition, maxValue);
			return;
		}

		setMaxValue(newHandlePosition);
		onChange(minValue, newHandlePosition);
	};

	const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		const img = new Image();
		img.src =
			"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // Прозрачен пиксел
		e.dataTransfer.setDragImage(img, 0, 0);
	};

	return {
		minValue,
		maxValue,
		firstHandlePosition,
		secondHandlePosition,
		bgRef,
		handleMinHandleDrag: (clientX: number) =>
			updateHandlePosition({
				clientX,
				valueServed: "lower",
				lowValue: minValue,
				topValue: maxValue,
			}),
		handleMaxHandleDrag: (clientX: number) =>
			updateHandlePosition({
				clientX,
				valueServed: "upper",
				lowValue: minValue,
				topValue: maxValue,
			}),
		handleTrackClick,
		handleDragStart,
	};
};

const calculateHandlePositionPercentage = (
	value: number,
	min: number,
	max: number,
) => ((value - min) / (max - min)) * 100;

const getShouldUpdate = (
	steppedValue: number,
	lowValue: number,
	topValue: number,
	min: number,
	max: number,
	valueServed: CalculateValueParams["valueServed"],
) => {
	if (valueServed === "lower") {
		return steppedValue < calculateHandlePositionPercentage(topValue, min, max);
	}
	return steppedValue > calculateHandlePositionPercentage(lowValue, min, max);
};
