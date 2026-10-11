import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MissionLocationsState } from "@/popup/features/missions/hooks/useMissionLocations";
import { MissionsForm } from "./MissionsForm";

const loaded: MissionLocationsState = {
	status: "loaded",
	city: "Тестов град",
	locations: [
		{ id: "forest", name: "Гора" },
		{ id: "cave", name: "Пещера" },
	],
};

const renderForm = (locationsState: MissionLocationsState = loaded) => {
	const onSubmit = vi.fn();
	const onLoadLocations = vi.fn();

	const view = render(
		<MissionsForm
			locationsState={locationsState}
			onLoadLocations={onLoadLocations}
			onSubmit={onSubmit}
		/>,
	);

	return { ...view, onSubmit, onLoadLocations };
};

const clickNext = async (nextTitle: string) => {
	fireEvent.click(screen.getByRole("button", { name: "Next" }));
	await screen.findByRole("heading", { name: nextTitle });
};

describe("MissionsForm", () => {
	it("Next е забранен, докато не е избрана локация", () => {
		renderForm();

		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("показва града и локациите като бутони", () => {
		renderForm();

		expect(screen.getByText("Тестов град")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Гора" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Пещера" })).toBeInTheDocument();
	});

	it("изборът на локация я маркира и разрешава Next", () => {
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Пещера" }));

		expect(screen.getByRole("button", { name: "Пещера" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "Гора" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
	});

	it("без заредени локации има само бутон за зареждане", () => {
		const { onLoadLocations } = renderForm({ status: "idle" });

		fireEvent.click(screen.getByRole("button", { name: "Load locations" }));

		expect(onLoadLocations).toHaveBeenCalledOnce();
		expect(screen.queryByRole("button", { name: "Гора" })).toBeNull();
	});

	it("бутонът за зареждане е забранен, докато се зарежда", () => {
		renderForm({ status: "loading" });

		expect(
			screen.getByRole("button", { name: "Loading locations..." }),
		).toBeDisabled();
	});

	it("показва защо локациите не могат да се прочетат", () => {
		renderForm({ status: "unavailable", reason: "traveling" });

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Your knight is traveling",
		);
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("повторното зареждане изчиства избраната локация", () => {
		const { onLoadLocations } = renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Гора" }));
		fireEvent.click(screen.getByRole("button", { name: "Reload locations" }));

		expect(onLoadLocations).toHaveBeenCalledOnce();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
	});

	it("Previous връща назад и запазва избора", async () => {
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Гора" }));
		await clickNext("Karma");

		fireEvent.click(screen.getByRole("button", { name: "Previous" }));
		await screen.findByRole("heading", { name: "Location" });

		expect(screen.getByRole("button", { name: "Гора" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	it("изборът на размер попълва стандартния cooldown", async () => {
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Гора" }));
		await clickNext("Karma");
		await clickNext("Mission size");
		fireEvent.click(screen.getByRole("button", { name: /Medium/ }));
		await clickNext("Cooldown");

		expect(screen.getByRole("spinbutton")).toHaveValue(20);
	});

	it("празен cooldown показва грешка и забранява старта", async () => {
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Гора" }));
		await clickNext("Karma");
		await clickNext("Mission size");
		await clickNext("Cooldown");

		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "" },
		});

		expect(
			await screen.findByText("Enter the cooldown in minutes"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Start missions" }),
		).toBeDisabled();
	});

	it("подава всички избрани настройки при старт", async () => {
		const { onSubmit } = renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Пещера" }));
		await clickNext("Karma");
		fireEvent.click(screen.getByRole("checkbox", { name: "Dark karma" }));
		await clickNext("Mission size");
		fireEvent.click(screen.getByRole("button", { name: /Large/ }));
		await clickNext("Cooldown");
		fireEvent.change(screen.getByRole("spinbutton"), {
			target: { value: "12" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Start missions" }));

		await vi.waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				location: { id: "cave", name: "Пещера" },
				karma: "dark",
				size: "large",
				cooldownMinutes: 12,
			}),
		);
	});
});
