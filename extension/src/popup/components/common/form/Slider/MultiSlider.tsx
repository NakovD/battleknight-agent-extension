import {
	type ComponentProps,
	type ComponentRef,
	useCallback,
	useRef,
	useState,
} from "react";
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
	min: number;
	max: number;
	step: number;
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

	const firstHandlePosition = calculateHandlePosition(minValue, min, max);
	const secondHandlePosition = calculateHandlePosition(maxValue, min, max);

	const bgRef = useRef<ComponentRef<"div">>(null);

	const calculateValue = useCallback(
		({
			clientX,
			lowValue,
			topValue,
			valueServed,
			...settings
		}: CalculateValueParams) => {
			if (!bgRef.current) return;

			const rect = bgRef.current.getBoundingClientRect();

			const width = rect.width;

			const offsetX = Math.min(Math.max(0, clientX - rect.left), width);

			const percentage = offsetX / width;

			const rawValue =
				percentage * (settings.max - settings.min) + settings.min;

			const steppedValue = Math.round(rawValue / settings.step) * settings.step;

			const shouldUpdate = getShouldUpdate(steppedValue, {
				clientX,
				lowValue,
				topValue,
				valueServed,
				...settings,
			});

			if (!shouldUpdate) return;

			if (valueServed === "lower") return setMinValue(steppedValue);

			setMaxValue(steppedValue);
		},
		[],
	);

	return (
		<div className="relative flex items-center h-5 cursor-pointer">
			{/* Track background */}
			<SliderTrackBackground ref={bgRef} />

			{/* Track fill */}
			<SliderBackgroundFill
				style={{
					width: `${secondHandlePosition - firstHandlePosition}%`,
					left: `${firstHandlePosition}%`,
				}}
			/>

			<SliderThumb
				position={firstHandlePosition}
				disabled={disabled}
				onDrag={(e) =>
					calculateValue({
						clientX: e.clientX,
						valueServed: "lower",
						max,
						min,
						step,
						lowValue: minValue,
						topValue: maxValue,
					})
				}
				onDragEnd={(e) =>
					calculateValue({
						clientX: e.clientX,
						valueServed: "lower",
						max,
						min,
						step,
						lowValue: minValue,
						topValue: maxValue,
					})
				}
			/>
			<SliderThumb
				position={secondHandlePosition}
				disabled={disabled}
				thumbInnerColorClassName="bg-amber-800"
				onDrag={(e) =>
					calculateValue({
						clientX: e.clientX,
						valueServed: "upper",
						max,
						min,
						step,
						lowValue: minValue,
						topValue: maxValue,
					})
				}
				onDragEnd={(e) =>
					calculateValue({
						clientX: e.clientX,
						valueServed: "upper",
						max,
						min,
						step,
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

const calculateHandlePosition = (value: number, min: number, max: number) =>
	((value - min) / (max - min)) * 100;

const getShouldUpdate = (
	steppedValue: number,
	settings: CalculateValueParams,
) => {
	if (settings.valueServed === "lower") {
		return (
			steppedValue <
			calculateHandlePosition(settings.topValue, settings.min, settings.max)
		);
	}
	return (
		steppedValue >
		calculateHandlePosition(settings.lowValue, settings.min, settings.max)
	);
};
