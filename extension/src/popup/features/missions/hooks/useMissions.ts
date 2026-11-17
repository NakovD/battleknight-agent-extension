import { useEffect, useState } from "react";
import { missionsAgentMessenger } from "@/common/features/missions/missionsAgentMessenger";
import type { MissionsSettings } from "@/common/features/missions/models/missionsSettings";
import type {
	MissionsAgentMessage,
	MissionsAgentResponse,
	MissionsState,
} from "@/common/features/missions/models/missionsState";

/** Omit, applied to each member of a union rather than to the union as one. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
	? Omit<T, K>
	: never;

import { missionsStatusUpdateValidator } from "@/common/features/missions/validators/missionsStateValidators";

/**
 * The missions agent of `tabId` — the game tab the popup was opened over — as
 * the popup sees it: its state, kept current by the background's
 * MISSIONS_STATUS_UPDATE for that tab, and the Start and Stop buttons.
 *
 * state is null until the first status arrives, so the form doesn't flash up
 * in front of an agent that is already running.
 */
export const useMissions = (tabId: number) => {
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

	const send = (message: DistributiveOmit<MissionsAgentMessage, "tabId">) =>
		missionsAgentMessenger
			.send({ ...message, tabId } as MissionsAgentMessage)
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
			// Every tab's agent reports here; only this tab's is shown.
			if (update.success && update.data.tabId === tabId) {
				setState(update.data.payload);
			}
		};

		chrome.runtime.onMessage.addListener(listener);
		return () => chrome.runtime.onMessage.removeListener(listener);
	}, [tabId]);

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
