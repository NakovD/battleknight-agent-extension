import { array, boolean, number, object, string } from "zod";

export const duelsFormValidator = object({
	maxLoot: number().min(0),
	skipWithOrder: boolean(),
	skipSpecificOrders: boolean(),
	specificOrders: array(object({ name: string() })).min(0),
	levels: array(number().min(1)).length(2),
});
