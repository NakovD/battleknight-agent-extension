import type { IDuelsSliderSettings } from "@/popup/features/duels/models/duelsSliderSettings";

export const sliderSettings: IDuelsSliderSettings[] = [
	{
		id: 0,
		max: 100_000,
		min: 0,
		step: 5_000,
		minThreshold: 0,
		maxThreshold: 95_000,
	},
	{
		id: 1,
		max: 1_000_000,
		min: 100_000,
		step: 50_000,
		minThreshold: 100_000,
		maxThreshold: 950_000,
	},
	{
		id: 2,
		step: 1_000_000,
		min: 1_000_000,
		max: 30_000_000,
		minThreshold: 3_000_000,
		maxThreshold: 28_000_000,
	},
	{
		id: 3,
		max: 100_000_000,
		min: 30_000_000,
		step: 5_000_000,
		minThreshold: 35_000_000,
		maxThreshold: 95_000_000,
	},
	{
		id: 4,
		min: 100_000_000,
		max: 1_000_000_000,
		step: 25_000_000,
		minThreshold: 125_000_000,
		maxThreshold: 95_000_000,
	},
] as const;
