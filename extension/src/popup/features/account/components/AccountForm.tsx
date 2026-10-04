import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import {
	loginCredentialsValidator,
	registerCredentialsValidator,
} from "@/common/features/auth/validators/authValidators";
import { Button } from "@/popup/components/common/button/button/Button";
import { Input } from "@/popup/components/common/form/Input";
import { Label } from "@/popup/components/common/form/Label";
import { Heading } from "@/popup/components/common/headings/Heading";
import { withPreventDefaultAndCb } from "@/popup/utilities/domEventUtility";

export type AccountFormMode = "login" | "register";

interface IAccountFormProps {
	error: string | null;
	isSubmitting: boolean;
	onSubmit: (
		mode: AccountFormMode,
		credentials: { email: string; password: string },
	) => void;
	onModeChange: () => void;
}

const firstErrorMessage = (errors: unknown[]) => {
	const [first] = errors;
	if (!first) return undefined;
	if (typeof first === "string") return first;
	return (first as { message?: string }).message;
};

export const AccountForm = ({
	error,
	isSubmitting,
	onSubmit,
	onModeChange,
}: IAccountFormProps) => {
	const [mode, setMode] = useState<AccountFormMode>("login");
	const isRegister = mode === "register";

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: {
			onChange: isRegister
				? registerCredentialsValidator
				: loginCredentialsValidator,
		},
		onSubmit: ({ value }) => onSubmit(mode, value),
	});

	const switchMode = () => {
		setMode(isRegister ? "login" : "register");
		onModeChange();
	};

	return (
		<form
			className="flex flex-col gap-5 py-3"
			onSubmit={withPreventDefaultAndCb(form.handleSubmit)}
			noValidate
		>
			<Heading subtitle="Optional — the extension works without one">
				{isRegister ? "Create account" : "Sign in"}
			</Heading>

			<form.Field
				name="email"
				children={(field) => (
					<Label>
						Email
						<Input
							type="email"
							name={field.name}
							autoComplete="email"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							error={
								field.state.meta.isTouched
									? firstErrorMessage(field.state.meta.errors)
									: undefined
							}
						/>
					</Label>
				)}
			/>

			<form.Field
				name="password"
				children={(field) => (
					<Label>
						Password
						<Input
							type="password"
							name={field.name}
							autoComplete={isRegister ? "new-password" : "current-password"}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							error={
								field.state.meta.isTouched
									? firstErrorMessage(field.state.meta.errors)
									: undefined
							}
						/>
					</Label>
				)}
			/>

			{error && (
				<p role="alert" className="text-[11px] text-red-400/90">
					{error}
				</p>
			)}

			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting
					? "Please wait..."
					: isRegister
						? "Create account"
						: "Sign in"}
			</Button>

			<Button
				type="button"
				styleType="secondary"
				onClick={switchMode}
				disabled={isSubmitting}
			>
				{isRegister
					? "Already have an account? Sign in"
					: "No account yet? Create one"}
			</Button>
		</form>
	);
};
