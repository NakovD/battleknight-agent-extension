import { useEffect, useState } from "react";
import { extensionMessenger } from "@/common/features/extensionMessenger";
import type {
	ExtensionMessage,
	ExtensionMessageResponse,
	ExtensionState,
} from "@/common/models/extenstion";
import { DuelsForm } from "@/popup/features/duels/components/DuelsForm";
import type { DuelsForm as DuelsFormType } from "@/popup/features/duels/models/duelsForm";
import type { duelsFormValidator } from "@/popup/features/duels/validators/duelsFormValidator";

export const Duels = () => {
	const [agentState, setAgentState] = useState<ExtensionState>({
		status: "idle",
		errorMessage: null,
	});

	useEffect(() => {
		extensionMessenger.send({ type: "GET_STATUS" }).then((response) => {
			if (response.ok) setAgentState(response.state);
		});
		chrome.runtime.sendMessage(
			{ type: "GET_STATUS" },
			(response: ExtensionMessageResponse) => {
				if (response?.ok) setAgentState(response.state);
			},
		);
	}, []);

	useEffect(() => {
		const handler = (msg: ExtensionMessage<typeof duelsFormValidator>) => {
			if (msg.type === "STATUS_UPDATE") setAgentState(msg.payload);
		};

		chrome.runtime.onMessage.addListener(handler);

		return () => chrome.runtime.onMessage.removeListener(handler);
	}, []);

	const handleSubmit = async (values: DuelsFormType) => {
		const response = await extensionMessenger.send({
			type: "START_AGENT",
			payload: values,
		});

		if (response.ok) {
			setAgentState(response.state);
			return;
		}
		setAgentState({ status: "error", errorMessage: response.error });
	};

	const handleStop = () => {
		chrome.runtime.sendMessage(
			{ type: "STOP_AGENT" },
			(response: ExtensionMessageResponse) => {
				if (response?.ok) setAgentState(response.state);
			},
		);
	};

	return (
		<>
			<DuelsForm onSubmit={handleSubmit} />
			<div />
		</>
	);
};
