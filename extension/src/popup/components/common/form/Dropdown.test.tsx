import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dropdown } from "./Dropdown";

const options = [
	{ value: "a", label: "Option A" },
	{ value: "b", label: "Option B" },
];

describe("Dropdown", () => {
	it("показва placeholder ако няма избрана стойност", () => {
		render(<Dropdown options={options} value={null} onChange={vi.fn()} />);

		expect(screen.getByText("Pick...")).toBeInTheDocument();
	});

	it("показва label-а на избраната опция", () => {
		const { container } = render(
			<Dropdown options={options} value={options[1]} onChange={vi.fn()} />,
		);
		const summary = container.querySelector("summary") as HTMLElement;

		expect(within(summary).getByText("Option B")).toBeInTheDocument();
	});

	it("извиква onChange с избраната опция при клик", () => {
		const onChange = vi.fn();
		render(<Dropdown options={options} value={null} onChange={onChange} />);

		fireEvent.click(screen.getByRole("button", { name: "Option A" }));

		expect(onChange).toHaveBeenCalledWith(options[0]);
	});

	it("затваря dropdown-а след избор", () => {
		render(<Dropdown options={options} value={null} onChange={vi.fn()} />);

		const details = screen.getByText("Pick...").closest("details");
		if (details) details.open = true;

		fireEvent.click(screen.getByRole("button", { name: "Option A" }));

		expect(details?.open).toBe(false);
	});

	it("извиква onBlur при загуба на фокус извън dropdown-а", () => {
		const onBlur = vi.fn();
		render(
			<Dropdown options={options} value={null} onChange={vi.fn()} onBlur={onBlur} />,
		);

		const details = screen.getByText("Pick...").closest("details") as HTMLElement;
		fireEvent.blur(details);

		expect(onBlur).toHaveBeenCalled();
	});

	it("рендира всички подадени опции", () => {
		render(<Dropdown options={options} value={null} onChange={vi.fn()} />);

		expect(screen.getByRole("button", { name: "Option A" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Option B" })).toBeInTheDocument();
	});
});
