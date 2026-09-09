import { DomDuelsEngine } from "@/content/features/duels/engines/domDuelsEngine";
import type { IDuelsEngine } from "@/content/features/duels/models/duelsEngine";
import type { DuelsEngineType } from "@/content/features/duels/models/duelsEngineType";

export function createDuelsEngine(
	variant: DuelsEngineType = "dom",
): IDuelsEngine {
	switch (variant) {
		case "dom":
			return new DomDuelsEngine();
		default:
			throw new Error(`Unknown engine variant: ${variant}`);
	}
}
