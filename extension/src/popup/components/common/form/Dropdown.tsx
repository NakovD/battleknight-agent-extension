import { ChevronDown } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { cn } from "@/popup/utilities/tailwindUtility";

export interface DropdownOption<T extends string = string> {
	value: T;
	label: string;
}

interface DropdownProps<T extends string = string> {
	options: DropdownOption<T>[];
	value: DropdownOption<T> | null;
	onChange: (value: DropdownOption<T>) => void;
	onBlur?: () => void;
	placeholder?: string;
	hint?: string;
	error?: string;
	disabled?: boolean;
	name?: string;
}

export const Dropdown = <T extends string = string>({
	options,
	value,
	onChange,
	onBlur,
	placeholder = "Pick...",
	hint,
	error,
	disabled = false,
	name,
}: DropdownProps<T>) => {
	const detailsRef = useRef<HTMLDetailsElement>(null);
	const selected = options.find((o) => o.value === value?.value) || null;

	const close = () => {
		if (detailsRef.current) detailsRef.current.open = false;
		onBlur?.();
	};

	const handleSelect = (optValue: T) => {
		const option = options.find((o) => o.value === optValue);
		if (option) {
			onChange(option);
		}
		close();
	};

	const handleBlur = (e: React.FocusEvent<HTMLDetailsElement>) => {
		if (!detailsRef.current?.contains(e.relatedTarget as Node)) {
			close();
		}
	};

	return (
		<div className="flex flex-col gap-1 w-full">
			<details
				ref={detailsRef}
				onBlur={handleBlur}
				className="relative group"
				style={{ listStyle: "none" }}
			>
				<summary
					tabIndex={disabled ? -1 : 0}
					className={cn(
						"relative flex items-center justify-between gap-2",
						"px-3 py-2 cursor-pointer select-none outline-none",
						"bg-stone-950/80 border text-sm",
						"transition-all duration-150",
						"focus-visible:ring-1 focus-visible:ring-amber-600/40",
						"[&::-webkit-details-marker]:hidden",
						error
							? "border-red-800/60"
							: "border-amber-900/30 group-open:border-amber-700/50",
						disabled
							? "opacity-40 cursor-not-allowed"
							: "hover:border-amber-700/40",
						selected ? "text-amber-100/90" : "text-stone-500",
					)}
				>
					<span className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-700/40" />
					<span className="pointer-events-none absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-700/40" />
					<span className="pointer-events-none absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-700/40" />
					<span className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-700/40" />

					<span>{selected ? selected.label : placeholder}</span>

					<ChevronDown
						size={13}
						className="text-amber-700/60 shrink-0 transition-transform duration-200 group-open:rotate-180"
					/>
				</summary>

				{name && <input type="hidden" name={name} value={value?.value ?? ""} />}

				<ul
					className={cn(
						"absolute z-50 w-full mt-0.5",
						"bg-stone-950 border border-amber-900/40",
						"py-0.5 max-h-48 overflow-y-auto",
						"shadow-[0_8px_24px_rgba(0,0,0,0.6)]",
					)}
				>
					{options.map((opt) => {
						const isSelected = opt.value === value?.value;
						return (
							<li key={opt.value}>
								<button
									type="button"
									onClick={() => handleSelect(opt.value)}
									className={cn(
										"w-full text-left px-3 py-2 text-sm",
										"transition-colors duration-100 outline-none",
										"focus-visible:bg-amber-900/20",
										isSelected
											? "text-amber-300 bg-amber-900/20"
											: "text-stone-300 hover:text-amber-200 hover:bg-stone-900/80",
									)}
								>
									{isSelected && (
										<span className="mr-2 text-amber-500 text-[10px]">◆</span>
									)}
									{opt.label}
								</button>
							</li>
						);
					})}
				</ul>
			</details>

			{hint && !error && <p className="text-[10px] text-stone-500">{hint}</p>}
			{error && <p className="text-[10px] text-red-500/80">{error}</p>}
		</div>
	);
};
