import type { FormField } from "../types";
import { Button, FieldError, Input, Label, Form } from "@heroui/react";
import { Check } from "@gravity-ui/icons";
import { FieldRenderMap } from "./Field-render";
import { useFormStore } from "../store";
import { FieldSelectorMenu } from "./ui";
import { EnableSwitch } from "./ui";
import { FORM_MODES } from "../constants/form-modes";
import { ModalWrapper } from "./forms";
import { Gear } from "@gravity-ui/icons";
import { FieldSettingsForm } from "./forms";


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
                    {schema.title}
                </h1>
            </div>


            <div className={`flex w-full sm:w-xl bg-overlay flex-col gap-2 p-8 border-2 border-default rounded-4xl ${className}`}>

                {!isSystemForm && (
                    <div className="flex items-center justify-between">
                        <EnableSwitch />
                        {(schemaMode === FORM_MODES.edit || schemaMode === FORM_MODES.create) &&
                            <div className="flex items-center gap-2">
                                <ModalWrapper content={<FieldSettingsForm />}>
                                    <Button isIconOnly variant="tertiary"><Gear /></Button>
                                </ModalWrapper>
                                <FieldSelectorMenu />
                            </div>
                        }
                    </div>
                )}

                <Form
                    validationBehavior="native"
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                >
                    {schema.fields.map((field: FormField) => {
                        const Component = FieldRenderMap[field.componentType]?.component ?? null;
                        if (!Component) return "";

                        const fieldElement = (

                            <Component

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
                            <div key={field.name}>
                                {/* Pronto aqui pondre un dragable */}
                                {fieldElement}
                            </div>
                        );
                    })}


                    {
                        schema.onSubmit && (
                            <input type="hidden" name="actionType" value={schema.onSubmit} />
                        )
                    }
                    <div className="flex gap-2">
                        <Button className="bg-green-600" type="submit">
                            <Check />
                            Submit
                        </Button>
                        <Button onClick={resetForm} className="text-foreground" type="reset" variant="secondary">
                            Reset
                        </Button>
                    </div>
                </Form >

            </div>




        </div >
    );
};