import { useEffect, useState } from "react";
import { extensionMessenger } from "@/common/features/extensionMessenger";
import type { ExtensionState } from "@/common/models/extenstion";
import { duelsInitialExtensionState } from "@/popup/features/duels/constants/duelsInitialExtensionState";
import type { DuelsForm as DuelsFormType } from "@/popup/features/duels/models/duelsForm";
import type { IDuelsSettings } from "@/popup/features/duels/models/duelsSettings";
import { duelsFormValidator } from "@/popup/features/duels/validators/duelsFormValidator";

export const useDuels = () => {
	const [extensionState, setExtensionState] = useState<
		ExtensionState & { settings: IDuelsSettings | null }
	>({ ...duelsInitialExtensionState, settings: null });

	useEffect(() => {
		extensionMessenger
			.send({ type: "GET_STATUS" })
			.then((res) => {
				// if (res.ok) setExtensionState({ ...res.state, settings: null });
				// else
				// 	setExtensionState({
				// 		status: "error",
				// 		errorMessage: res.error,
				// 		settings: null,
				// 	});
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
			// if (msg.type === "STATUS_UPDATE")
			// 	setExtensionState({ ...msg.payload, settings: null });
		}, duelsFormValidator);
	}, []);

	console.log(extensionState);

	const handleSubmit = async (values: DuelsFormType) => {
		try {
			const response = await extensionMessenger.send({
				type: "START_AGENT",
				payload: values,
			});

			if (response.ok)
				setExtensionState({
					...response.state,
					settings: {
						levelMin: values.levels[0],
						levelMax: values.levels[1],
						lootFilterEnabled: true,
						lootMax: values.maxLoot,
						skipAllOrders: values.skipWithOrder,
						skipSpecificOrders: values.skipSpecificOrders,
						ordersToSkip: values.specificOrders.map((o) => o.name),
					},
				});
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

	return {
		isRunning: extensionState.status === "running",
		duelsSettings: extensionState.settings,
		handleSubmit,
		handleStop,
	};
};
