import { DuelsOpponentLevelSettings } from "@/popup/features/duels/components/DuelsOpponentLevelSettings";
import { DuelsOpponentLootSettings } from "@/popup/features/duels/components/DuelsOpponentLootSettings";
import { duelsFormDefaultValues } from "@/popup/features/duels/constants/duelsFormDefaultValues";
import { withDuelsForm } from "@/popup/features/duels/form/duelsContext";

export const DuelsOpponentSettings = withDuelsForm({
	defaultValues: duelsFormDefaultValues,
	render: ({ form }) => (
		<>
			<DuelsOpponentLevelSettings form={form} />
			<DuelsOpponentLootSettings form={form} />
		</>
	),
});
