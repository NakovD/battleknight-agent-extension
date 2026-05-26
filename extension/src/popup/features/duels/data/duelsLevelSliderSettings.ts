import type { ISliderSettings } from "@/popup/components/common/form/Slider/models/sliderSettings";

export const duelsLevelSliderSettings: ISliderSettings[] = [
	{
		id: 0,
		max: 50,
		min: 0,
		step: 5,
	},
	{
		id: 1,
		max: 150,
		min: 50,
		step: 10,
	},
	{
		id: 2,
		max: 1000,
		min: 150,
		step: 50,
	},
] as const;
