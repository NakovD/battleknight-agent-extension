import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type IStep, Stepper } from "./Stepper";

const steps = (overrides: Partial<IStep>[] = []): IStep[] =>
	["Първа", "Втора", "Трета"].map((title, index) => ({
		title,
		content: <p>Съдържание {title}</p>,
		isComplete: true,
		...overrides[index],
	}));

const finalAction = <button type="button">Готово</button>;

describe("Stepper", () => {
	it("показва само първата стъпка в началото", () => {
		render(<Stepper steps={steps()} finalAction={finalAction} />);

		expect(screen.getByText("Съдържание Първа")).toBeInTheDocument();
		expect(screen.queryByText("Съдържание Втора")).not.toBeInTheDocument();
		expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
	});

	it("Previous е забранен на първата стъпка", () => {
		render(<Stepper steps={steps()} finalAction={finalAction} />);

		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
	});

	it("Next е забранен, докато стъпката не е завършена", () => {
		render(
			<Stepper
				steps={steps([{ isComplete: false }])}
				finalAction={finalAction}
			/>,
		);

		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("Next и Previous сменят стъпката", async () => {
		render(<Stepper steps={steps()} finalAction={finalAction} />);

		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(await screen.findByText("Съдържание Втора")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Previous" }));
		expect(await screen.findByText("Съдържание Първа")).toBeInTheDocument();
	});

	it("бутоните са забранени, докато тече fade-ът", async () => {
		render(<Stepper steps={steps()} finalAction={finalAction} />);

		fireEvent.click(screen.getByRole("button", { name: "Next" }));

		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

		await screen.findByText("Съдържание Втора");
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
		expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
	});

	it("на последната стъпка показва finalAction вместо Next", async () => {
		render(<Stepper steps={steps()} finalAction={finalAction} />);

		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		await screen.findByText("Съдържание Втора");
		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		await screen.findByText("Съдържание Трета");

		expect(screen.getByRole("button", { name: "Готово" })).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Next" }),
		).not.toBeInTheDocument();
	});
});
