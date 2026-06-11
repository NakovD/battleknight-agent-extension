import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

const { fieldContext: duelsFieldContext, formContext: duelsFormContext } =
	createFormHookContexts();

export const { useAppForm: useDuelsForm, withForm: withDuelsForm } =
	createFormHook({
		fieldContext: duelsFieldContext,
		formContext: duelsFormContext,
		fieldComponents: {},
		formComponents: {},
	});
