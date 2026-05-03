import { type ComponentRef, useRef, useState } from "react";
import { SliderBackgroundFill } from "@/popup/components/common/form/Slider/components/SliderBackgroundFill";
import { SliderTrackBackground } from "@/popup/components/common/form/Slider/components/SliderBackgroundTrack";
import { SliderThumb } from "@/popup/components/common/form/Slider/components/SliderThumb";

interface IMultiSliderProps {
	max?: number;
	step?: number;
	min?: number;
	lowerValue: number;
	upperValue: number;
	hint?: string;
	error?: string;
	disabled?: boolean;
}

type CalculateValueParams = {
	clientX: number;
	valueServed: "lower" | "upper";
	lowValue: number;
	topValue: number;
};

export const MultiSlider = ({
	lowerValue,
	upperValue,
	min = 0,
	max = 100,
	step = 10,
	hint,
	error,
	disabled,
}: IMultiSliderProps) => {
	const [minValue, setMinValue] = useState(lowerValue);
	const [maxValue, setMaxValue] = useState(upperValue);

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

	const bgRef = useRef<ComponentRef<"div">>(null);

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

		if (valueServed === "lower") return setMinValue(newHandlePosition);

		setMaxValue(newHandlePosition);
	};

	const handleTrackClick = (clientX: number) => {
		if (disabled) return;

		const newHandlePosition = calculateNewHandlePosition(clientX);

		if (newHandlePosition === undefined) return;

		const distToMin = Math.abs(newHandlePosition - minValue);
		const distToMax = Math.abs(newHandlePosition - maxValue);

		if (distToMin < distToMax) {
			setMinValue(newHandlePosition);
			return;
		}

		setMaxValue(newHandlePosition);
	};

	return (
		<div className="relative flex items-center h-5">
			{/* Track background */}
			<SliderTrackBackground
				ref={bgRef}
				onClick={(e) => handleTrackClick(e.clientX)}
			/>

			{/* Track fill */}
			<SliderBackgroundFill
				style={{
					width: `${secondHandlePosition - firstHandlePosition}%`,
					left: `${firstHandlePosition}%`,
				}}
				onClick={(e) => handleTrackClick(e.clientX)}
			/>

			<SliderThumb
				position={firstHandlePosition}
				disabled={disabled}
				thumbValue={minValue}
				onDrag={(e) =>
					updateHandlePosition({
						clientX: e.clientX,
						valueServed: "lower",
						lowValue: minValue,
						topValue: maxValue,
					})
				}
				onDragEnd={(e) =>
					updateHandlePosition({
						clientX: e.clientX,
						valueServed: "lower",
						lowValue: minValue,
						topValue: maxValue,
					})
				}
			/>
			<SliderThumb
				position={secondHandlePosition}
				disabled={disabled}
				thumbInnerColorClassName="bg-amber-800"
				thumbValue={maxValue}
				onDrag={(e) =>
					updateHandlePosition({
						clientX: e.clientX,
						valueServed: "upper",
						lowValue: minValue,
						topValue: maxValue,
					})
				}
				onDragEnd={(e) =>
					updateHandlePosition({
						clientX: e.clientX,
						valueServed: "upper",
						lowValue: minValue,
						topValue: maxValue,
					})
				}
			/>
			{hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
			{error && <p className="text-sm text-red-500 mt-1">{error}</p>}
		</div>
	);
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
