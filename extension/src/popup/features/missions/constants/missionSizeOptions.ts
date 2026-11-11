import type { MissionSize } from "@/common/features/missions/models/missionsSettings";

export const missionSizeOptions: { value: MissionSize; label: string }[] = [
	{ value: "small", label: "Small" },
	{ value: "medium", label: "Medium" },
	{ value: "large", label: "Large" },
];
