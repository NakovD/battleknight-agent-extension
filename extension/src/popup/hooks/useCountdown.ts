import { useEffect, useState } from "react";

/** Milliseconds left until `until`, ticking every second. Null without one. */
export const useCountdown = (until: number | null) => {
	const [now, setNow] = useState(Date.now);

	useEffect(() => {
		if (until === null) return;

		setNow(Date.now());
		const interval = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(interval);
	}, [until]);

	return until === null ? null : Math.max(0, until - now);
};
