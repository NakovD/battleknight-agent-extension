import { duelsFormPagesOptions } from "@/popup/features/duels/constants/duelsFormPagesOptions";

export const duelsFormDefaultValues = {
	maxLoot: 3_000_000,
	skipWithOrder: false,
	skipSpecificOrders: false,
	specificOrders: [] as { name: string }[],
	levels: [0, 30],
	page: duelsFormPagesOptions[0],
};
