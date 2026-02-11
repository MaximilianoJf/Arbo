import type { FormField } from "../types";
import { Button, FieldError, Input, Label, Form } from "@heroui/react";
import { Check } from "@gravity-ui/icons";
import { useSubmit } from 'react-router-dom';
import { useMemo, useState } from "react";
import { FORM_ACTIONS_MAP } from "../services";
import { FieldRender } from "./Field-render";
import { useFormStore } from "../store";
import { FieldSelectorMenu, EnableSwitch } from "./ui";


interface DynamicFormProps {
    className?: string;
}

export const DynamicForm = ({

    className,

}: DynamicFormProps) => {

    const { schema, isSystemForm } = useFormStore();

    const submit = useSubmit();

    const [formState, setFormState] = useState<Record<string, { value: string | number, error: string | null }>>(() => {
        return schema.fields.reduce((acc, field) => {
            acc[field.name] = {
                value: field.value,
                error: field.error ?? null
            };
            return acc;
        }, {} as Record<string, { value: string | number, error: string | null }>);
    });


    const allValues = useMemo(() => Object.entries(formState).reduce((acc, [key, field]) => {
        acc[key] = field.value;
        return acc;
    }, {} as Record<string, string | number>), [formState]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: { value, error: null } }));
        validateSubmit(name, value)
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();


        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (validateSubmit()) return;

        if (schema.onSubmit) {
            const actionToExecute = FORM_ACTIONS_MAP[schema.onSubmit];
            if (actionToExecute) {
                actionToExecute(data);
            }
            return;
        } else {
            submit(data as any, { method: "post" });
        }

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
            if (!field.validate) return;

            const currentValue = updatedState[field.name].value;
            const error = field.validate(currentValue, allValues);

            updatedState[field.name] = {
                ...updatedState[field.name],
                error: error || null
            };

            if (error) isInvalid = !!error;
        });

        setFormState(updatedState);
        return isInvalid;
    };

    const validateSingleField = (inputName: string, inputValue: string | number): boolean => {
        const field = schema.fields.find(f => f.name === inputName);
        if (!field || !field.validate) return false;

        const currentValues = { ...allValues, [inputName]: inputValue };
        const error = field.validate(inputValue, currentValues);

        setFormState(prev => {
            const newState = {
                ...prev,
                [inputName]: { ...prev[inputName], value: inputValue, error: error || null }
            };

            field.dependencies?.forEach(depName => {
                const depField = schema.fields.find(f => f.name === depName);
                const depState = prev[depName];

                if (depField?.validate && depState) {
                    const depError = depField.validate(depState.value, currentValues);
                    newState[depName] = { ...depState, error: depError || null };
                }
            });

            return newState;
        });

        return !!error;
    };

    const resetForm = (() => {
        setFormState(() => {
            return schema.fields.reduce((acc, field) => {
                acc[field.name] = {
                    value: field.value,
                    error: field.error ?? null
                };
                return acc;
            }, {} as Record<string, { value: string | number, error: string | null }>);
        });
    })



    return (
        <div className="flex flex-col justify-center items-center gap-4">

            <div className="flex items-center gap-4">

                <h1 className="text-4xl font-bold text-foreground/80">
                    {schema.tittle}
                </h1>
            </div>
            <Form
                validationBehavior="native"
                onSubmit={handleSubmit}
                className={`flex w-full sm:w-xl bg-overlay flex-col gap-4 p-8 border-2 border-default rounded-4xl ${className}`}
            >

                {!isSystemForm && (
                    <div className="flex justify-between">
                        <EnableSwitch />
                        <FieldSelectorMenu />
                    </div>

                )}


                {schema.fields.map((field: FormField) => {
                    const Component = FieldRender[field.componentType];

                    const fieldElement = (
                        <Component
                            key={field.name}
                            formState={formState}
                            required={field.required}
                            name={field.name}
                            type={field.type}
                            validate={field.validate}
                            minLength={field.minLength}
                            maxLength={field.maxLength}
                            handleInputChange={handleInputChange}
                            placeholder={field.placeholder}
                            label={field.label}
                        >
                            <Label>{field.label}</Label>
                            <Input placeholder={field.placeholder} />
                            <FieldError />
                        </Component>
                    );

                    if (isSystemForm) {
                        return <div key={field.name}>{fieldElement}</div>;
                    }

                    // 3. Si NO es de sistema, lo envolvemos para que sea arrastrable
                    return (
                        <>
                            {fieldElement}
                        </>
                    );
                })}


                {schema.onSubmit && (
                    <input type="hidden" name="actionType" value={schema.onSubmit} />
                )}
                <div className="flex gap-2">
                    <Button className="bg-green-600" type="submit">
                        <Check />
                        Submit
                    </Button>
                    <Button onClick={resetForm} className="text-foreground" type="reset" variant="secondary">
                        Reset
                    </Button>
                </div>
            </Form>
        </div>
    );
};