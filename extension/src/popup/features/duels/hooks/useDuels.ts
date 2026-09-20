import { useEffect, useState } from "react";
import { duelsSettingsMessenger } from "@/common/features/duels/duelsSettingsMessenger";
import type { DuelsSettings } from "@/common/features/duels/models/duelsSettings";
import { duelsSettingsValidator } from "@/common/features/duels/validators/duelsSettingsValidator";
import { extensionMessenger } from "@/common/features/extensionMessenger";
import type { ExtensionState } from "@/common/models/extension";
import { duelsInitialExtensionState } from "@/popup/features/duels/constants/duelsInitialExtensionState";
import type { DuelsForm as DuelsFormType } from "@/popup/features/duels/models/duelsForm";
import {
	mapFormToSettings,
	mapSettingsToForm,
} from "@/popup/features/duels/utilities/duelsFormMapping";

export const useDuels = () => {
	const [extensionState, setExtensionState] = useState<
		ExtensionState<typeof duelsSettingsValidator>
	>({ ...duelsInitialExtensionState, settings: null });

	/** undefined while the account's saved settings are still being fetched. */
	const [savedFormValues, setSavedFormValues] = useState<
		DuelsFormType | undefined
	>(undefined);
	const [areSettingsLoaded, setAreSettingsLoaded] = useState(false);
	const [syncWarning, setSyncWarning] = useState<string | null>(null);

	useEffect(() => {
		duelsSettingsMessenger
			.send({ type: "SETTINGS_LOAD" })
			.then((response) => {
				// A failure here only means the form falls back to local defaults, so it
				// is surfaced as a warning rather than taking over the whole tab.
				if (!response.ok) {
					setSyncWarning(response.error);
					return;
				}

				if (response.settings) {
					setSavedFormValues(mapSettingsToForm(response.settings));
				}
			})
			.catch(() => setSyncWarning("Could not load settings from your account."))
			.finally(() => setAreSettingsLoaded(true));
	}, []);

	useEffect(() => {
		extensionMessenger
			.send({ type: "GET_STATUS" }, duelsSettingsValidator)
			.then((res) => {
				if (res.ok) setExtensionState(res.state);
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
			if (msg.type === "STATUS_UPDATE") setExtensionState(msg.payload);
		}, duelsSettingsValidator);
	}, []);

	/**
	 * Persists to the account, if one is signed in. Never blocks starting the agent:
	 * a sync failure is reported alongside a running agent, not instead of one.
	 */
	const saveToAccount = async (settings: DuelsSettings) => {
		try {
			const response = await duelsSettingsMessenger.send({
				type: "SETTINGS_SAVE",
				payload: settings,
			});

			setSyncWarning(response.ok ? null : response.error);
		} catch {
			setSyncWarning("Could not save settings to your account.");
		}
	};

	const handleSubmit = async (values: DuelsFormType) => {
		try {
			const settings = mapFormToSettings(values);
			void saveToAccount(settings);

			const response = await extensionMessenger.send(
				{ type: "START_AGENT", payload: settings },
				duelsSettingsValidator,
			);

			if (response.ok) setExtensionState(response.state);
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
			const res = await extensionMessenger.send(
				{ type: "STOP_AGENT" },
				duelsSettingsValidator,
			);
			if (res.ok) setExtensionState(res.state);
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
		const res = await extensionMessenger.send(
			{ type: "START_AGENT", payload: extensionState.settings },
			duelsSettingsValidator,
		);
		if (res.ok) setExtensionState(res.state);
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
		areSettingsLoaded,
		savedFormValues,
		syncWarning,
		handleSubmit,
		handleStop,
		handleRetry,
		handleBack,
	};
};
