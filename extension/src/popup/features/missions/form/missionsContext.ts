import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

const { fieldContext: missionsFieldContext, formContext: missionsFormContext } =
	createFormHookContexts();

export const { useAppForm: useMissionsForm, withForm: withMissionsForm } =
	createFormHook({
		fieldContext: missionsFieldContext,
		formContext: missionsFormContext,
		fieldComponents: {},
		formComponents: {},
	});
