import type { MissionSize } from "@/popup/features/missions/models/missionsForm";

/**
 * defaultCooldownMinutes is the standard server's return time. Faster servers
 * come back sooner, by an amount that differs per server — which is why the
 * cooldown is only prefilled from here and left for the user to adjust.
 */
export const missionSizeOptions: {
	value: MissionSize;
	label: string;
	defaultCooldownMinutes: number;
}[] = [
	{ value: "small", label: "Small", defaultCooldownMinutes: 10 },
	{ value: "medium", label: "Medium", defaultCooldownMinutes: 20 },
	{ value: "large", label: "Large", defaultCooldownMinutes: 30 },
];
