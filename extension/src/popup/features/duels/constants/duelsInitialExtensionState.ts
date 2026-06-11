import type { ExtensionState } from "@/common/models/extenstion";

export const duelsInitialExtensionState: ExtensionState = {
	status: "idle",
	errorMessage: null,
} as const;
