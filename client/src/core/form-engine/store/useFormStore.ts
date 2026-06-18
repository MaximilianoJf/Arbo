import { useContext, useState, useMemo } from "react";
import { FormContext } from "./FormContext";
import type { FormField, FormState, ComponentType } from "../types";
import { useSubmit } from "react-router-dom";
import { FORM_ACTIONS_MAP, parseSubmitActions } from "../services";
import { getValidationFn } from "../utils";
import { isFieldVisible } from "../utils/field-logic";
import { formApi } from "@/services/api";

export const useFormStore = () => {
    const submit = useSubmit();
    const context = useContext(FormContext);
    if (!context) throw new Error("useFormStore must be used within FormProvider");

    const { schema, setSchema, schemaMode, setSchemaMode, isSystemForm, onAuthSubmit, activePage, setActivePage } = context;

    const [formState, setFormState] = useState<FormState>(() => {
        return schema.fields.reduce((acc, field) => {
            acc[field.name] = {
                value: field.value ?? "",
                error: field.error ?? null,
            };
            return acc;
        }, {} as FormState);
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: { value, error: null } }));
        validateSubmit(name, value);
    };

    const allValues = useMemo(
        () =>
            Object.entries(formState).reduce(
                (acc, [key, field]) => {
                    acc[key] = field.value;
                    return acc;
                },
                {} as Record<string, string | number>
            ),
        [formState]
    );

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (validateSubmit()) return;

        const data: Record<string, any> = {};
        for (const [key, field] of Object.entries(formState)) {
            data[key] = field.value;
        }

        if (onAuthSubmit) {
            onAuthSubmit(data);
            return;
        }

        if (schema.onSubmit) {
            // onSubmit may hold several comma-separated actions — run every known one
            for (const action of parseSubmitActions(schema.onSubmit)) {
                const actionToExecute = FORM_ACTIONS_MAP[action as keyof typeof FORM_ACTIONS_MAP];
                if (actionToExecute) actionToExecute(data as any);
            }
            return;
        }

        submit(data as any, { method: "post" });
    };

    const validateSubmit = (inputName?: string, inputValue?: string | number): boolean => {
        return !inputName
            ? validateAllFields()
            : validateSingleField(inputName, inputValue!);
    };

    const validateAllFields = (): boolean => {
        let isInvalid = false;
        const updatedState = { ...formState };

        schema.fields.forEach((field: FormField) => {
            const state = updatedState[field.name];
            if (!state) return;

            // Hidden fields (conditional logic) are not validated
            if (!isFieldVisible(field, allValues)) {
                updatedState[field.name] = { ...state, error: null };
                return;
            }

            const validate = getValidationFn(field.validate || [], field.name, field);
            const error = validate(state.value, allValues);

            updatedState[field.name] = { ...state, error: error || null };
            if (error) isInvalid = true;
        });

        setFormState(updatedState);
        return isInvalid;
    };

    const validateSingleField = (inputName: string, inputValue: string | number): boolean => {
        const field = schema.fields.find((f) => f.name === inputName);
        if (!field) return false;

        const currentValues = { ...allValues, [inputName]: inputValue };
        const validate = getValidationFn(field.validate || [], inputName, field);
        const error = validate(inputValue, currentValues);

        setFormState((prev) => {
            const newState = {
                ...prev,
                [inputName]: { ...(prev[inputName] ?? { value: inputValue }), value: inputValue, error: error || null },
            };

            field.dependencies?.forEach((depName) => {
                const depField = schema.fields.find((f) => f.name === depName);
                const depState = prev[depName];

                if (depField && depState) {
                    const depValidate = getValidationFn(depField.validate || [], depName, depField);
                    const depError = depValidate(depState.value, currentValues);
                    newState[depName] = { ...depState, error: depError || null };
                }
            });

            return newState;
        });

        return !!error;
    };

    const resetForm = () => {
        setFormState(
            schema.fields.reduce((acc, field) => {
                acc[field.name] = { value: field.value ?? "", error: null };
                return acc;
            }, {} as FormState)
        );
    };

    const addField = (e: React.FormEvent<HTMLFormElement>, options?: string[]) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const selectedValidations = formData.getAll("validations") as string[];
        const raw = Object.fromEntries(formData.entries());

        const newField: FormField = {
            id: crypto.randomUUID(),
            name: raw.title
                ? String(raw.title).toLowerCase().replace(/\s+/g, "_")
                : `field_${Date.now()}`,
            label: String(raw.title || ""),
            placeholder: String(raw.placeholder || ""),
            type: String(raw.type || "text"),
            componentType: String(raw.componentType || "DynamicTextField") as ComponentType,
            value: String(raw.value || ""),
            required: false,
            validate: selectedValidations,
            options: options && options.length > 0 ? options : undefined,
            sortOrder: schema.fields.length,
            page: activePage,
        };

        setSchema((prev) => ({
            ...prev,
            fields: [...prev.fields, newField],
        }));

        setFormState((prev) => ({
            ...prev,
            [newField.name]: { value: newField.value, error: null },
        }));
    };

    const reorderFields = (oldIndex: number, newIndex: number) => {
        setSchema((prev) => {
            const fields = [...prev.fields];
            const [moved] = fields.splice(oldIndex, 1);
            fields.splice(newIndex, 0, moved);
            return { ...prev, fields };
        });
    };

    const removeField = async (fieldName: string) => {
        const target = schema.fields.find((f) => f.name === fieldName);
        let toRemove = [fieldName];

        // Composite component: removing one member would break its logic — delete the whole group.
        // Warn about existing response data being nullified.
        if (target?.groupId) {
            const members = schema.fields.filter((f) => f.groupId === target.groupId);
            if (members.length > 1) {
                // Check if the form has existing responses that will be affected.
                let responseCount = 0;
                if (schema.id) {
                    try { responseCount = (await formApi.getResponseCount(schema.id)).data.count; } catch { /* non-blocking */ }
                }

                const dataWarning = responseCount > 0
                    ? `\n\n⚠️ Este formulario tiene ${responseCount} respuesta${responseCount !== 1 ? "s" : ""} guardada${responseCount !== 1 ? "s" : ""}. Los valores de estos campos quedarán en null en todas esas respuestas y podrían causar errores en reportes o exportaciones.`
                    : "";

                const ok = window.confirm(
                    `"${target.groupLabel || target.label}" es un componente compuesto (${members.length} campos con lógica conectada).\n\nSe eliminará el componente completo para no romper su comportamiento.${dataWarning}\n\n¿Continuar?`
                );
                if (!ok) return;
                toRemove = members.map((f) => f.name);
            }
        }

        const removeSet = new Set(toRemove);
        setSchema((prev) => ({
            ...prev,
            fields: prev.fields.filter((f) => !removeSet.has(f.name)),
        }));

        setFormState((prev) => {
            const next = { ...prev };
            toRemove.forEach((n) => delete next[n]);
            return next;
        });

        // Nullify the removed fields in all existing responses so they don't carry stale data.
        if (schema.id && toRemove.length > 0) {
            formApi.nullifyResponseFields(schema.id, toRemove).catch(() => { /* best-effort */ });
        }
    };

    return {
        formState,
        setFormState,
        handleSubmit,
        handleInputChange,
        schema,
        setSchema,
        addField,
        removeField,
        reorderFields,
        schemaMode,
        setSchemaMode,
        isSystemForm,
        validateSubmit,
        validateAllFields,
        validateSingleField,
        resetForm,
        activePage,
        setActivePage,
    };
};
