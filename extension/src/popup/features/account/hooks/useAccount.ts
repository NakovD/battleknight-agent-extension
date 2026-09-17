import { useEffect, useState } from "react";
import { authMessenger } from "@/common/features/auth/authMessenger";
import type {
	Account,
	AuthMessage,
	LoginCredentials,
	RegisterCredentials,
} from "@/common/features/auth/validators/authValidators";

const unreachableBackgroundMessage =
	"Could not reach the extension. Try reopening the popup.";

export const useAccount = () => {
	/** null while the stored session is still being read. */
	const [account, setAccount] = useState<Account | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		authMessenger
			.send({ type: "AUTH_GET_ACCOUNT" })
			.then((response) => {
				if (response.ok) {
					setAccount(response.account);
					return;
				}
				setAccount({ status: "signedOut" });
				setError(response.error);
			})
			.catch(() => {
				setAccount({ status: "signedOut" });
				setError(unreachableBackgroundMessage);
			});
	}, []);

	const send = async (message: AuthMessage) => {
		setIsSubmitting(true);
		setError(null);

		try {
			const response = await authMessenger.send(message);

			if (response.ok) {
				setAccount(response.account);
			} else {
				setError(response.error);
			}
		} catch {
			setError(unreachableBackgroundMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	return {
		account,
		error,
		isSubmitting,
		clearError: () => setError(null),
		login: (credentials: LoginCredentials) =>
			send({ type: "AUTH_LOGIN", payload: credentials }),
		register: (credentials: RegisterCredentials) =>
			send({ type: "AUTH_REGISTER", payload: credentials }),
		logout: () => send({ type: "AUTH_LOGOUT" }),
	};
};
