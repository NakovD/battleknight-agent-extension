import type { SyntheticEvent } from "react";

export const withpreventDefault = (event: Event) => event.preventDefault();

export const withPreventDefaultAndCb = <T extends SyntheticEvent>(
	callback?: (event: T) => void,
) => {
	return (event: T) => {
		event.preventDefault();
		callback?.(event);
	};
};
