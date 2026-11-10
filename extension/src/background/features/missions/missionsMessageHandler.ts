import type { IDuelsExtensionController } from "@/background/features/duels/models/duelsExtensionController.ts ";
import type { GameTabWorldMapReader } from "@/background/features/missions/gameTabWorldMapReader";
import type { MessageHandler } from "@/background/models/messageHandler";
import type { MissionLocationsResult } from "@/common/features/missions/models/missionLocations";
import { missionsMessageValidator } from "@/common/features/missions/validators/missionLocationsValidators";

export const createMissionsMessageHandler =
	(
		worldMap: Pick<GameTabWorldMapReader, "read">,
		duels: Pick<IDuelsExtensionController, "getStatus">,
	): MessageHandler =>
	(raw) => {
		if (!missionsMessageValidator.safeParse(raw).success) return null;

		const handle = async (): Promise<MissionLocationsResult> => {
			// Loading the map navigates the game tab, which the duels agent is
			// driving — it would lose its place mid-step.
			if ((await duels.getStatus()).status === "running") {
				return { status: "unavailable", reason: "duels-running" };
			}

			return worldMap.read();
		};

		return handle().catch((err): MissionLocationsResult => {
			console.error("[background] Reading the world map failed:", err);
			return { status: "unavailable", reason: "world-unreachable" };
		});
	};
