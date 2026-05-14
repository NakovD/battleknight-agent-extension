interface ITooltipArrowProps {
	direction: "top" | "bottom" | "left" | "right";
}

export const TooltipArrow = ({ direction }: ITooltipArrowProps) => {
	const base = "absolute w-0 h-0";

	const styles: Record<typeof direction, React.CSSProperties> = {
		top: {
			top: 0,
			left: "50%",
			transform: "translateX(-50%) translateY(-100%)",
			borderLeft: "5px solid transparent",
			borderRight: "5px solid transparent",
			borderBottom: "5px solid rgb(120 53 15 / 0.5)",
		},
		bottom: {
			bottom: 0,
			left: "50%",
			transform: "translateX(-50%) translateY(100%)",
			borderLeft: "5px solid transparent",
			borderRight: "5px solid transparent",
			borderTop: "5px solid rgb(120 53 15 / 0.5)",
		},
		left: {
			left: 0,
			top: "50%",
			transform: "translateY(-50%) translateX(-100%)",
			borderTop: "5px solid transparent",
			borderBottom: "5px solid transparent",
			borderRight: "5px solid rgb(120 53 15 / 0.5)",
		},
		right: {
			right: 0,
			top: "50%",
			transform: "translateY(-50%) translateX(100%)",
			borderTop: "5px solid transparent",
			borderBottom: "5px solid transparent",
			borderLeft: "5px solid rgb(120 53 15 / 0.5)",
		},
	};

	return <span className={base} style={styles[direction]} />;
};
