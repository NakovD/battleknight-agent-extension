import { SliderBackgroundFill } from "@/popup/components/common/form/Slider/components/SliderBackgroundFill";
import { SliderTrackBackground } from "@/popup/components/common/form/Slider/components/SliderBackgroundTrack";
import { SliderDynamicScale } from "@/popup/components/common/form/Slider/components/SliderLabel";
import { SliderThumb } from "@/popup/components/common/form/Slider/components/SliderThumb";
import { useMultiSlider } from "@/popup/components/common/form/Slider/hooks/useMultiSlider";

interface IMultiSliderProps {
	max?: number;
	step?: number;
	min?: number;
	lowerValue: number;
	upperValue: number;
	hint?: string;
	error?: string;
	disabled?: boolean;
	showScale?: boolean;
	formatLabel?: (value: number) => string;
}

export const MultiSlider = ({
	lowerValue,
	upperValue,
	min = 0,
	max = 100,
	step = 10,
	hint,
	error,
	disabled,
	showScale = true,
	formatLabel = (val) => val.toString(),
}: IMultiSliderProps) => {
	const {
		minValue,
		maxValue,
		firstHandlePosition,
		secondHandlePosition,
		bgRef,
		handleMinHandleDrag,
		handleMaxHandleDrag,
		handleTrackClick,
		handleDragStart,
	} = useMultiSlider({
		lowerValue,
		upperValue,
		min,
		max,
		step,
		disabled,
	});
	return (
		<>
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
					draggable={true}
					thumbValue={minValue}
					onDrag={(e) => handleMinHandleDrag(e.clientX)}
					onDragEnd={(e) => handleMinHandleDrag(e.clientX)}
					onDragStart={handleDragStart}
					formatLabel={formatLabel}
				/>
				<SliderThumb
					draggable={true}
					position={secondHandlePosition}
					disabled={disabled}
					thumbInnerColorClassName="bg-amber-800"
					thumbValue={maxValue}
					onDrag={(e) => handleMaxHandleDrag(e.clientX)}
					onDragEnd={(e) => handleMaxHandleDrag(e.clientX)}
					onDragStart={handleDragStart}
					formatLabel={formatLabel}
				/>

				{hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
				{error && <p className="text-sm text-red-500 mt-1">{error}</p>}
			</div>
			{showScale && (
				<SliderDynamicScale
					min={min}
					max={max}
					stepLabels={step}
					formatLabel={formatLabel}
				/>
			)}
		</>
	);
};
