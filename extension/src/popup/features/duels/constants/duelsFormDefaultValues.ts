export const duelsFormDefaultValues = {
	maxLoot: 3_000_000,
	skipWithOrder: false,
	skipSpecificOrders: false,
	specificOrders: [] as { name: string }[],
	levels: [0, 30],
	page: { label: "Page 1-100", value: "0" },
};
