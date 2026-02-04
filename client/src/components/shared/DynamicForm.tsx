import type { FormField } from "../../interfaces";
import { Button, FieldError, Input, Label, Form } from "@heroui/react";
import { Check } from "@gravity-ui/icons";
import FormComponentMap from "./FormComponents";
import { useSubmit } from 'react-router-dom';
import { useState } from "react";

interface DynamicFormProps<T extends FormField[]> {
    dynamicFormConfig: T;
    className?: string;
}

export const DynamicForm = <T extends FormField[]>({
    dynamicFormConfig,
    className
}: DynamicFormProps<T>) => {
    const submit = useSubmit();


    const [formState, setFormState] = useState<Record<string, { value: string | number, error: string | null }>>(() => {
        return dynamicFormConfig.reduce((acc, field) => {
            acc[field.name] = {
                value: field.value,
                error: field.error ?? null
            };
            return acc;
        }, {} as Record<string, { value: string | number, error: string | null }>);
    });


    const [values, setValues] = useState<Record<string, string | number>>(() => {
        return dynamicFormConfig.reduce((acc, field) => {
            acc[field.name] = field.value;
            return acc;
        }, {} as Record<string, string | number>);
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: { value, error: null } }));
        console.log(formState)
    };


    // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const { name, value } = e.target;
    //     console.log(name, value)
    //     setValues(prev => ({ ...prev, [name]: value }));
    // };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        console.log(formState)

        if (validateSubmit()) return;

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        type DynamicData = Record<T[number]["name"], string | number>;
        submit(data as DynamicData, { method: "post" });
    };

    const validateSubmit = () => {

        dynamicFormConfig.map((field: FormField) => {
            if (values[field.name as keyof typeof values] == '') {
                console.log('rellene todos los campos');
            }

        })

        return true
    }

    return (
        <Form
            validationBehavior="native"
            onSubmit={handleSubmit}
            className={`flex w-full sm:w-xl bg-overlay flex-col gap-4 p-8 border-2 border-default rounded-4xl ${className}`}
        >
            {dynamicFormConfig.map((field: FormField) => {
                const Component = FormComponentMap[field.componentType];
                return (
                    <Component
                        key={field.name}
                        formState={formState}
                        required={field.required}
                        name={field.name}
                        type={field.type}
                        validate={field.validate}
                        minLength={field.minLength}
                        maxLength={field.maxLenght}
                        handleInputChange={handleInputChange}
                        placeholder={field.placeholder}
                        label={field.label}

                    >
                        <Label>{field.label}</Label>
                        <Input placeholder={field.placeholder} />
                        <FieldError />
                    </Component>
                );
            })}

            <div className="flex gap-2">
                <Button className="bg-green-600" type="submit">
                    <Check />
                    Submit
                </Button>
                <Button className="text-foreground" type="reset" variant="secondary">
                    Reset
                </Button>
            </div>
        </Form>
    );
};