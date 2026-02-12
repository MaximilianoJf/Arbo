import type { FormField } from "../types";
import { Button, FieldError, Input, Label, Form } from "@heroui/react";
import { Check } from "@gravity-ui/icons";


import { FieldRender } from "./Field-render";
import { useFormStore } from "../store";
import { FieldSelectorMenu } from "./ui";
import { EnableSwitch } from "./ui";
import { FORM_MODES } from "../constants/form-modes";

interface DynamicFormProps {
    className?: string;
}

export const DynamicForm = ({
    className,
}: DynamicFormProps) => {

    const { schema, isSystemForm, schemaMode, formState, handleInputChange, handleSubmit, resetForm } = useFormStore();

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
                    <div className="flex items-center justify-between">
                        <EnableSwitch />
                        {schemaMode === FORM_MODES.edit || schemaMode === FORM_MODES.create && <FieldSelectorMenu />}
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


                    return (
                        <>
                            {/* Pronto aqui pondre un dragable */}
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