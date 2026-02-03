import type { FormField } from "../../interfaces";
import { Button, FieldError, Input, Label, Form } from "@heroui/react";
import { Check } from "@gravity-ui/icons";
import FormComponentMap from "./FormComponents";
import { useSubmit } from 'react-router-dom';

interface DynamicFormProps<T extends FormField[]> {
    dynamicFormConfig: T;
    className?: string;
}

export const DynamicForm = <T extends FormField[]>({
    dynamicFormConfig,
    className
}: DynamicFormProps<T>) => {
    const submit = useSubmit();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();


        const formData = new FormData(e.currentTarget);

        const data = Object.fromEntries(formData.entries());
        console.log(data)
        type DynamicData = Record<T[number]["name"], string>;
        submit(data as DynamicData, { method: "post" });
    };

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
                        isRequired={field.required}
                        name={field.name}
                        type={field.type}
                        validate={field.validate}
                        minLength={field.minLength}
                        maxLength={field.maxLenght}
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