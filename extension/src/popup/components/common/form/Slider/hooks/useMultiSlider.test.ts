import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMultiSlider } from "./useMultiSlider";

/** Track с ширина 200px, започващ от x=0 — offsetX == clientX за тестовете. */
function attachTrackRef(bgRef: { current: HTMLElement | null }) {
	const el = document.createElement("div");
	el.getBoundingClientRect = () =>
		({ left: 0, width: 200 }) as DOMRect;
	bgRef.current = el;
}

describe("useMultiSlider", () => {
	it("изчислява позициите на дръжките като процент от диапазона", () => {
		const { result } = renderHook(() =>
			useMultiSlider({
				lowerValue: 20,
				upperValue: 80,
				min: 0,
				max: 100,
				step: 1,
				onChange: vi.fn(),
			}),
		);

		expect(result.current.firstHandlePosition).toBe(20);
		expect(result.current.secondHandlePosition).toBe(80);
	});

	it("влачене на долната дръжка обновява минималната стойност", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMultiSlider({
				lowerValue: 10,
				upperValue: 90,
				min: 0,
				max: 100,
				step: 1,
				onChange,
			}),
		);
		attachTrackRef(result.current.bgRef);

		// track е 200px широк за диапазон 0-100 → clientX=50 → 25% → value=25
		act(() => {
			result.current.handleMinHandleDrag(50);
		});

		expect(onChange).toHaveBeenCalledWith(25, 90);
	});

	it("не позволява долната дръжка да задмине горната (regression: единиците бяха разминати за диапазони ≠ 100)", () => {
		const onChange = vi.fn();
		// диапазон 0-1000 (както duelsLevelSliderSettings tier 2) — max-min ≠ 100,
		// точно случаят, в който старата % логика беше грешна.
		const { result } = renderHook(() =>
			useMultiSlider({
				lowerValue: 200,
				upperValue: 400,
				min: 0,
				max: 1000,
				step: 10,
				onChange,
			}),
		);
		attachTrackRef(result.current.bgRef);

		// clientX=180 от 200px track → 90% от 0-1000 → value=900, доста над upperValue=400
		act(() => {
			result.current.handleMinHandleDrag(180);
		});

		expect(onChange).not.toHaveBeenCalled();
		expect(result.current.minValue).toBe(200);
	});

	it("не позволява горната дръжка да мине под долната", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMultiSlider({
				lowerValue: 200,
				upperValue: 400,
				min: 0,
				max: 1000,
				step: 10,
				onChange,
			}),
		);
		attachTrackRef(result.current.bgRef);

		// clientX=20 от 200px track → 10% от 0-1000 → value=100, под lowerValue=200
		act(() => {
			result.current.handleMaxHandleDrag(20);
		});

		expect(onChange).not.toHaveBeenCalled();
		expect(result.current.maxValue).toBe(400);
	});

	it("клик върху пистата премества по-близката дръжка", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMultiSlider({
				lowerValue: 10,
				upperValue: 90,
				min: 0,
				max: 100,
				step: 1,
				onChange,
			}),
		);
		attachTrackRef(result.current.bgRef);

		// clientX=30 → value=15, по-близо до lowerValue (10) отколкото upperValue (90)
		act(() => {
			result.current.handleTrackClick(30);
		});

		expect(onChange).toHaveBeenCalledWith(15, 90);
	});

	it("игнорира клик върху пистата ако е disabled", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useMultiSlider({
				lowerValue: 10,
				upperValue: 90,
				min: 0,
				max: 100,
				step: 1,
				disabled: true,
				onChange,
			}),
		);
		attachTrackRef(result.current.bgRef);

		act(() => {
			result.current.handleTrackClick(30);
		});

		expect(onChange).not.toHaveBeenCalled();
	});
});
