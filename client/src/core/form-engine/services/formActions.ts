import type { FormFunctionsType, FormActionFn } from "../types";
import { formApi } from "@/services/api";

export const FormFunctions = {
    SendToEmail: "SendToEmail",
    SaveToDB: "SaveToDB",
} as const;

/** Parses a comma-separated onSubmit value into the list of actions to run (defaults to SaveToDB). */
export const parseSubmitActions = (onSubmit?: string): string[] => {
    const actions = (onSubmit || FormFunctions.SaveToDB).split(",").map((a) => a.trim()).filter(Boolean);
    return actions.length > 0 ? actions : [FormFunctions.SaveToDB];
};

const sendToEmail: FormActionFn = async (data) => {
    const { _formId, _respondentName, _respondentEmail, ...answers } = data;
    const mailto = `mailto:?subject=Form Response&body=${encodeURIComponent(JSON.stringify(answers))}`;
    window.open(mailto, "_blank");
};

const saveToDB: FormActionFn = async (data) => {
    const { _formId, _respondentName, _respondentEmail, ...answers } = data;
    const formId = Number(_formId);
    if (!formId) return;

    await formApi.submitResponse(formId, answers, {
        respondentName: String(_respondentName || ""),
        respondentEmail: String(_respondentEmail || ""),
    });
};

export const FORM_ACTIONS_MAP: Record<FormFunctionsType, FormActionFn> = {
    [FormFunctions.SendToEmail]: sendToEmail,
    [FormFunctions.SaveToDB]: saveToDB,
};
