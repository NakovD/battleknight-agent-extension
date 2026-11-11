import { useEffect, useState } from "react";
import { missionsAgentMessenger } from "@/common/features/missions/missionsAgentMessenger";
import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import type {
	MissionsAgentResponse,
	MissionsState,
} from "@/common/features/missions/models/missionsState";
import { missionsStatusUpdateValidator } from "@/common/features/missions/validators/missionsStateValidators";

/**
 * The missions agent as the popup sees it: its state, kept current by the
 * background's MISSIONS_STATUS_UPDATE, and the Start and Stop buttons.
 *
 * state is null until the first status arrives, so the form doesn't flash up
 * in front of an agent that is already running.
 */
export const useMissions = () => {
	const [state, setState] = useState<MissionsState | null>(null);
	/** A request the background refused or never answered. */
	const [requestError, setRequestError] = useState<string | null>(null);

	const apply = (response: MissionsAgentResponse) => {
		if (response.ok) {
			setState(response.state);
			setRequestError(null);
		} else {
			setRequestError(response.error);
		}
	};

	const send = (message: Parameters<typeof missionsAgentMessenger.send>[0]) =>
		missionsAgentMessenger
			.send(message)
			.then(apply)
			.catch((error: unknown) =>
				setRequestError(
					typeof error === "string" ? error : "Could not reach the extension.",
				),
			);

	// biome-ignore lint/correctness/useExhaustiveDependencies: once, on open
	useEffect(() => {
		void send({ type: "MISSIONS_GET_STATUS" });
	}, []);

	useEffect(() => {
		const listener = (raw: unknown) => {
			const update = missionsStatusUpdateValidator.safeParse(raw);
			if (update.success) setState(update.data.payload);
		};

		chrome.runtime.onMessage.addListener(listener);
		return () => chrome.runtime.onMessage.removeListener(listener);
	}, []);

	return {
		state,
		requestError,
		handleStart: (settings: MissionsSettings) =>
			send({ type: "MISSIONS_START", payload: settings }),
		handleStop: () => send({ type: "MISSIONS_STOP" }),
		/**
		 * Leaves the error screen for the form. An error the agent stored is
		 * cleared through Stop, or it would be back the next time the popup opens.
		 */
		handleBack: () => {
			setRequestError(null);
			if (state?.status === "error") void send({ type: "MISSIONS_STOP" });
		},
	};
};
