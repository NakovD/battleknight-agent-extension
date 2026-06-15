import type { ExtensionState } from "@/common/models/extension";

export const duelsInitialExtensionState: ExtensionState = {
	status: "idle",
	errorMessage: null,
} as const;
