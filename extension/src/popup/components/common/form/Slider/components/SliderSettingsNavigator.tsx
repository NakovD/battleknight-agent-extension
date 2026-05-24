import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { IconButton } from "@/popup/components/common/button/iconButton/IconButton";

interface ISliderSettingsNavigatorProps {
	handlePrev: () => void;
	handleNext: () => void;
	disabledPrev: boolean;
	disabledNext: boolean;
}

export const SliderSettingsNavigator = ({
	handlePrev,
	handleNext,
	disabledPrev,
	disabledNext,
}: ISliderSettingsNavigatorProps) => (
	<div className="flex items-center justify-center gap-10 pbs-3 pbe-5">
		<IconButton onClick={handlePrev} disabled={disabledPrev}>
			<ChevronsLeft className="text-amber-700/70" />
		</IconButton>
		<IconButton onClick={handleNext} disabled={disabledNext}>
			<ChevronsRight className="text-amber-700/70" />
		</IconButton>
	</div>
);
