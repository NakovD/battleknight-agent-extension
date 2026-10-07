/**
 * The first message out of a TanStack field's errors.
 *
 * Standard Schema validators hand back issue objects, while a plain function
 * validator hands back a string — the form keeps both as-is.
 */
export const firstErrorMessage = (errors: unknown[]) => {
	const [first] = errors;

	if (!first) return undefined;
	if (typeof first === "string") return first;

	return (first as { message?: string }).message;
};
