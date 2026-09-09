import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
	it("рендира checkbox input", () => {
		render(<Toggle value={false} onChange={() => {}} />);

		expect(screen.getByRole("checkbox")).toBeInTheDocument();
	});

	it("checkbox-ът е checked когато value е true", () => {
		render(<Toggle value={true} onChange={() => {}} />);

		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	it("checkbox-ът не е checked когато value е false", () => {
		render(<Toggle value={false} onChange={() => {}} />);

		expect(screen.getByRole("checkbox")).not.toBeChecked();
	});

	it("показва hint текст ако е подаден и няма грешка", () => {
		render(<Toggle value={false} onChange={() => {}} hint="Помощен текст" />);

		expect(screen.getByText("Помощен текст")).toBeInTheDocument();
	});

	it("показва error вместо hint ако и двата са подадени", () => {
		render(
			<Toggle
				value={false}
				onChange={() => {}}
				hint="Помощен текст"
				error="Грешка"
			/>,
		);

		expect(screen.getByText("Грешка")).toBeInTheDocument();
		expect(screen.queryByText("Помощен текст")).not.toBeInTheDocument();
	});

	it("checkbox-ът е disabled когато е подадено disabled", () => {
		render(<Toggle value={false} onChange={() => {}} disabled />);

		expect(screen.getByRole("checkbox")).toBeDisabled();
	});
});
