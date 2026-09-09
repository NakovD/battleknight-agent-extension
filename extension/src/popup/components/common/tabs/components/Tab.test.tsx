import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tab } from "./Tab";

describe("Tab", () => {
	it("извиква onClick при клик", () => {
		const onClick = vi.fn();
		render(
			<Tab id="duels" isActive={false} label="Duels" onClick={onClick} />,
		);

		fireEvent.click(screen.getByRole("tab"));

		expect(onClick).toHaveBeenCalledOnce();
	});

	it("не извиква onClick когато е disabled", () => {
		const onClick = vi.fn();
		render(
			<Tab
				id="duels"
				isActive={false}
				label="Duels"
				onClick={onClick}
				disabled
			/>,
		);

		fireEvent.click(screen.getByRole("tab"));

		expect(onClick).not.toHaveBeenCalled();
	});

	it("aria-selected отразява isActive", () => {
		render(<Tab id="duels" isActive={true} label="Duels" onClick={vi.fn()} />);

		expect(screen.getByRole("tab")).toHaveAttribute("aria-selected", "true");
	});

	it("aria-controls сочи към съответния tabpanel", () => {
		render(<Tab id="duels" isActive={false} label="Duels" onClick={vi.fn()} />);

		expect(screen.getByRole("tab")).toHaveAttribute(
			"aria-controls",
			"tabpanel-duels",
		);
	});
});
