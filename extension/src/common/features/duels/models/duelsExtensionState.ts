import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import type { ExtensionState } from "@/common/models/extension";

export type DuelsExtensionState = ExtensionState & {
	settings: DuelsSettings | null;
};
