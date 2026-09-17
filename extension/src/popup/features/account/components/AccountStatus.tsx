import { Button } from "@/popup/components/common/button/button/Button";

interface IAccountStatusProps {
	email: string;
	isSubmitting: boolean;
	error: string | null;
	onLogout: () => void;
}

export const AccountStatus = ({
	email,
	isSubmitting,
	error,
	onLogout,
}: IAccountStatusProps) => (
	<div className="flex flex-col gap-4 p-4">
		<div className="flex flex-col gap-1">
			<span className="text-[10px] uppercase tracking-widest font-serif text-amber-600/60">
				Signed in as
			</span>
			<span className="text-sm text-amber-200/90 break-all">{email}</span>
		</div>

		<div className="h-px bg-linear-to-r from-transparent via-amber-900/40 to-transparent" />

		{error && (
			<p role="alert" className="text-[11px] text-red-400/90">
				{error}
			</p>
		)}

		<Button styleType="secondary" onClick={onLogout} disabled={isSubmitting}>
			Log out
		</Button>
	</div>
);
