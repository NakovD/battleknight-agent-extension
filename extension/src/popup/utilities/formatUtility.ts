export const formatNumberAdvanced = (
	num: number,
	options?: Intl.NumberFormatOptions,
): string =>
	new Intl.NumberFormat(navigator.language || "en-US", {
		maximumFractionDigits: 2,
		...options,
	}).format(num);
