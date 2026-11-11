export const formatNumberAdvanced = (
	num: number,
	options?: Intl.NumberFormatOptions,
): string =>
	new Intl.NumberFormat(navigator.language || "en-US", {
		maximumFractionDigits: 2,
		...options,
	}).format(num);

/** A countdown's time left: "4:05", or "1:04:05" past an hour. */
export const formatDuration = (ms: number) => {
	const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = String(totalSeconds % 60).padStart(2, "0");

	return hours > 0
		? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
		: `${minutes}:${seconds}`;
};
