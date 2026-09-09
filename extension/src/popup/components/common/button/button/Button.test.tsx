import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
	it("рендира children-и", () => {
		render(<Button>Start extension</Button>);

		expect(screen.getByText("Start extension")).toBeInTheDocument();
	});

	it("има type='button' по подразбиране", () => {
		render(<Button>Click</Button>);

		expect(screen.getByRole("button")).toHaveAttribute("type", "button");
	});

	it("извиква onClick при клик", () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Click</Button>);

		fireEvent.click(screen.getByRole("button"));

		expect(onClick).toHaveBeenCalledOnce();
	});

	it("е disabled когато е подадено disabled", () => {
		render(<Button disabled>Click</Button>);

		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("прилага различни класове за primary и secondary styleType", () => {
		const { rerender } = render(<Button styleType="primary">A</Button>);
		const primaryClassName = screen.getByRole("button").className;

		rerender(<Button styleType="secondary">A</Button>);
		const secondaryClassName = screen.getByRole("button").className;

		expect(primaryClassName).not.toBe(secondaryClassName);
	});
});
