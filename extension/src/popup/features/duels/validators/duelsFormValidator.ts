import { array, boolean, number, object, string } from "zod";

/** Both mirror the API's DuelsSettingsRequest, which rejects anything larger. */
export const MAX_ORDERS_TO_SKIP = 50;
export const MAX_ORDER_NAME_LENGTH = 100;

export const duelsFormValidator = object({
	maxLoot: number().min(0),
	skipWithOrder: boolean(),
	skipSpecificOrders: boolean(),
	specificOrders: array(object({ name: string() })),
	levels: array(number()).length(2),
	page: object({ label: string(), value: string() }),
	cooldownMinutes: number().min(1, "Cooldown must be at least 1 minute"),
}).check((ctx) => {
	const { skipWithOrder, skipSpecificOrders, specificOrders } = ctx.value;

	// The rows are only rendered when both toggles are on, so the rules only
	// apply then: a leftover blank row must not disable Start over an error the
	// user has no way of seeing.
	if (!skipWithOrder || !skipSpecificOrders) return;

	if (specificOrders.length > MAX_ORDERS_TO_SKIP) {
		ctx.issues.push({
			code: "custom",
			input: specificOrders,
			path: ["specificOrders"],
			message: `At most ${MAX_ORDERS_TO_SKIP} orders can be skipped`,
		});
	}

	specificOrders.forEach((order, index) => {
		// Trimmed, because that is the form the name is saved and compared in.
		const name = order.name.trim();

		const message = !name
			? "Enter an order name or remove the row"
			: name.length > MAX_ORDER_NAME_LENGTH
				? `An order name must be at most ${MAX_ORDER_NAME_LENGTH} characters`
				: null;

		if (message) {
			ctx.issues.push({
				code: "custom",
				input: order.name,
				path: ["specificOrders", index, "name"],
				message,
			});
		}
	});
});
