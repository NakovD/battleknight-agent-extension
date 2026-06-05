import { useEffect, useState } from "react";
import { extensionMessenger } from "@/common/features/extensionMessenger";
import type { ExtensionState } from "@/common/models/extenstion";
import { DuelsForm } from "@/popup/features/duels/components/DuelsForm";
import { DuelsStatus } from "@/popup/features/duels/components/DuelsStatus";
import { duelsInitialExtensionState } from "@/popup/features/duels/constants/duelsInitialExtensionState";
import type { DuelsForm as DuelsFormType } from "@/popup/features/duels/models/duelsForm";
import { duelsFormValidator } from "@/popup/features/duels/validators/duelsFormValidator";

export const Duels = () => {
	const [extensionState, setExtensionState] = useState<ExtensionState>(
		duelsInitialExtensionState,
	);

	useEffect(() => {
		extensionMessenger
			.send({ type: "GET_STATUS" })
			.then((res) => {
				if (res.ok) setExtensionState(res.state);
				else setExtensionState({ status: "error", errorMessage: res.error });
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		return extensionMessenger.listen((msg) => {
			if (msg.type === "STATUS_UPDATE") setExtensionState(msg.payload);
		}, duelsFormValidator);
	}, []);

	const handleSubmit = async (values: DuelsFormType) => {
		const response = await extensionMessenger.send({
			type: "START_AGENT",
			payload: values,
		});

		if (response.ok) setExtensionState(response.state);
		else setExtensionState({ status: "error", errorMessage: response.error });
	};

	const handleStop = async () => {
		const res = await extensionMessenger.send({ type: "STOP_AGENT" });
		if (res.ok) setExtensionState(res.state);
		else setExtensionState({ status: "error", errorMessage: res.error });
	};

	const isRunning = extensionState.status === "running";

	return (
		<div className="w-full">
			{!isRunning && (
				<DuelsStatus
					settings={{
						levelMax: 15,
						levelMin: 1,
						lootFilterEnabled: true,
						lootMax: 1000,
						skipAllOrders: true,
						skipSpecificOrders: true,
						ordersToSkip: ["dawdad", "dawdawd"],
					}}
					onStop={handleStop}
				/>
			)}
			{isRunning && <DuelsForm onSubmit={handleSubmit} />}
		</div>
	);
};
