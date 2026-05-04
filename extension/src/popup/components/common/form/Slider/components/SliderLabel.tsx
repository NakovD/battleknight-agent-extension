interface IDynamicScaleProps {
	min: number;
	max: number;
	stepLabels?: number;
}

export const SliderDynamicScale = ({
	min,
	max,
	stepLabels = 10,
}: IDynamicScaleProps) => {
	const markers = [];
	for (let i = min; i <= max; i += stepLabels) {
		markers.push(i);
	}

	return (
		<div className="relative w-full h-8 mt-2">
			<div className="absolute top-0 left-0 w-full h-px bg-amber-700/60" />

			{markers.map((val) => {
				const leftPos = ((val - min) / (max - min)) * 100;

				return (
					<div
						key={val}
						className="absolute flex flex-col items-center -translate-x-1/2"
						style={{ left: `${leftPos}%` }}
					>
						<div className="w-px h-2 bg-amber-500" />

						<span className="text-xs text-amber-500 mt-1 tabular-nums">
							{val}
						</span>
					</div>
				);
			})}
		</div>
	);
};
