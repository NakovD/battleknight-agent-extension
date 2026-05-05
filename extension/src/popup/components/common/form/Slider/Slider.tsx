import type { ComponentPropsWithRef } from "react";
import { SliderBackgroundFill } from "@/popup/components/common/form/Slider/components/SliderBackgroundFill";
import { SliderTrackBackground } from "@/popup/components/common/form/Slider/components/SliderBackgroundTrack";
import { SliderDynamicScale } from "@/popup/components/common/form/Slider/components/SliderLabel";
import { SliderThumb } from "@/popup/components/common/form/Slider/components/SliderThumb";

interface ISliderProps
	extends Omit<
		ComponentPropsWithRef<"input">,
		"value" | "checked" | "className" | "type"
	> {
	max?: number;
	step?: number;
	min?: number;
	value: number;
	hint?: string;
	error?: string;
}

export const Slider = ({
	hint,
	value,
	error,
	disabled,
	step = 1,
	max = 100,
	min = 0,
	...rest
}: ISliderProps) => {
	const percentage = ((value - min) / (max - min)) * 100;

	return (
		<div className="flex flex-col">
			<div className="relative flex items-center h-5">
				<SliderTrackBackground />

				<SliderBackgroundFill
					style={{
						width: `${percentage}%`,
					}}
				/>

				<input
					type="range"
					{...rest}
					step={step}
					min={min}
					max={max}
					value={value}
					className="opacity-1 z-10 w-full cursor-pointer"
					disabled={disabled}
				/>

				<SliderThumb position={percentage} thumbValue={value} />
			</div>
			<SliderDynamicScale min={min} max={max} stepLabels={step} />

			{hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
			{error && <p className="text-sm text-red-500 mt-1">{error}</p>}
		</div>
	);
};
