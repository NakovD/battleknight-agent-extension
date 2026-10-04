import { AccountForm } from "@/popup/features/account/components/AccountForm";
import { AccountStatus } from "@/popup/features/account/components/AccountStatus";
import { useAccount } from "@/popup/features/account/hooks/useAccount";

export const Account = () => {
	const { account, error, isSubmitting, clearError, login, register, logout } =
		useAccount();

	if (account === null) {
		return <p className="p-4 text-[11px] text-stone-500">Loading account...</p>;
	}

	if (account.status === "signedIn") {
		return (
			<AccountStatus
				email={account.email}
				isSubmitting={isSubmitting}
				error={error}
				onLogout={logout}
			/>
		);
	}

	return (
		<AccountForm
			error={error}
			isSubmitting={isSubmitting}
			onModeChange={clearError}
			onSubmit={(mode, credentials) =>
				mode === "register" ? register(credentials) : login(credentials)
			}
		/>
	);
};
