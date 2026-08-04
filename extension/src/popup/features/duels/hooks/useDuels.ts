import { useEffect, useState } from "react";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import { duelsSettingsValidator } from "@/common/features/duels/validators/duelsSettingsValidator";
import { extensionMessenger } from "@/common/features/extensionMessenger";
import type { ExtensionState } from "@/common/models/extension";
import { duelsInitialExtensionState } from "@/popup/features/duels/constants/duelsInitialExtensionState";
import type { DuelsForm as DuelsFormType } from "@/popup/features/duels/models/duelsForm";

const RANKING_PAGE_SIZE = 100;

const mapFormToSettings = (values: DuelsFormType): DuelsSettings => ({
	levelMin: values.levels[0],
	levelMax: values.levels[1],
	lootFilterEnabled: true,
	lootMax: values.maxLoot,
	skipAllOrders: values.skipWithOrder,
	skipSpecificOrders: values.skipSpecificOrders,
	ordersToSkip: values.specificOrders.map((o) => o.name),
	cooldownMs: values.cooldownMinutes * 60_000,
	rankingOffset: Number(values.page.value) * RANKING_PAGE_SIZE,
});

export const useDuels = () => {
	const [extensionState, setExtensionState] = useState<
		ExtensionState & { settings: DuelsSettings | null }
	>({ ...duelsInitialExtensionState, settings: null });

	useEffect(() => {
		extensionMessenger
			.send({ type: "GET_STATUS" })
			.then((res) => {
				if (res.ok)
					setExtensionState((prev) => ({ ...res.state, settings: prev.settings }));
				else
					setExtensionState({
						status: "error",
						errorMessage: res.error,
						settings: null,
					});
			})
			.catch((message: string) =>
				setExtensionState({
					status: "error",
					errorMessage: message,
					settings: null,
				}),
			);
	}, []);

	useEffect(() => {
		return extensionMessenger.listen((msg) => {
			if (msg.type === "STATUS_UPDATE")
				setExtensionState((prev) => ({ ...msg.payload, settings: prev.settings }));
		}, duelsSettingsValidator);
	}, []);

	const handleSubmit = async (values: DuelsFormType) => {
		try {
			const settings = mapFormToSettings(values);
			const response = await extensionMessenger.send({
				type: "START_AGENT",
				payload: settings,
			});

			if (response.ok)
				setExtensionState({ ...response.state, settings });
			else
				setExtensionState({
					status: "error",
					errorMessage: response.error,
					settings: null,
				});
		} catch (error) {
			setExtensionState({
				status: "error",
				errorMessage: error as string,
				settings: null,
			});
		}
	};

	const handleStop = async () => {
		try {
			const res = await extensionMessenger.send({ type: "STOP_AGENT" });
			if (res.ok)
				setExtensionState({
					status: "idle",
					errorMessage: null,
					settings: null,
				});
			else
				setExtensionState({
					status: "error",
					errorMessage: res.error,
					settings: null,
				});
		} catch (error) {
			setExtensionState({
				status: "error",
				errorMessage: error as string,
				settings: null,
			});
		}
	};

	const handleRetry = async () => {
		if (!extensionState.settings) return;
		const res = await extensionMessenger.send({
			type: "START_AGENT",
			payload: extensionState.settings,
		});
		if (res.ok)
			setExtensionState({ ...res.state, settings: extensionState.settings });
	};

	const handleBack = () => {
		setExtensionState((prev) => ({
			...prev,
			status: "idle",
			errorMessage: null,
		}));
	};

	return {
		isRunning: extensionState.status === "running",
		isError: extensionState.status === "error",
		duelsSettings: extensionState.settings,
		errorMessage: extensionState.errorMessage,
		handleSubmit,
		handleStop,
		handleRetry,
		handleBack,
	};
};
