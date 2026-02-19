
import { Check, Gear } from "@gravity-ui/icons";
import { Form, TextField, Label, Input, FieldError, Button, Modal } from "@heroui/react";
import { FIELD_COMPONENTS } from "../../constants";
import { CustomMultipleSelect, CustomSelect, SimpleSelect } from "@/core/components";
import { useState } from "react";
import type { FieldSettingsFormState } from "../../types";
import { useEffect, useMemo, useContext } from "react";
import { FormContext } from "../../store";
/**
 * @title Controlled Content Component
 * @description Componente "consumidor" que reacciona al estado externo (isOpen) 
 * y ejecuta callbacks de cierre (closeModal) inyectados por el Wrapper.
 */

interface FieldSettingsFormProps {
    closeModal?: () => void;
    isOpen?: boolean;
}

interface FormState {
    title: string;
    placeholder: string;
    type: string;
    componentType: string;
    value: string;
    validations: string[];
}


export function FieldSettingsForm({ closeModal, isOpen }: FieldSettingsFormProps) {
    const context = useContext(FormContext);

    if (!context) throw new Error("FieldSettingsForm debe estar dentro de FormProvider");

    const { setSchema } = context;




    const [formConfig, setFormConfig] = useState<FieldSettingsFormState>({
        types: [],
        validations: [],
    });


    const [form, setForm] = useState<FormState>({
        'title': '',
        'placeholder': '',
        'type': '',
        'componentType': '',
        'value': '',
        'validations': [],
    })



    useEffect(() => {
        console.log("Estado FORM actualizado:", form);
    }, [form]);

    useEffect(() => {
        console.log("Estado CONFIG actualizado:", formConfig);
    }, [formConfig]);


    useEffect(() => {
        getComponentTypes(form.componentType);
        setForm(prev => ({ ...prev, type: '', validations: [] }));

    }, [form.componentType]);

    useEffect(() => {
        if (form.type && form.componentType) {
            getTypeValidations(form.type, form.componentType);
            setForm(prev => ({ ...prev, validations: [] }));

        }
    }, [form.type, form.componentType]);


    const hasTypes = useMemo(() => {
        return formConfig?.types && formConfig.types.length > 0;
    }, [formConfig.types])

    const hasValidations = useMemo(() => {
        return formConfig?.validations && formConfig.validations.length > 0;
    }, [formConfig.validations]);


    const getComponentTypes = (componentValue: string) => {
        const selected = FIELD_COMPONENTS.find((c) => c.value === componentValue);
        if (selected?.types) {
            const tipos = selected.types.map(t => t.type);
            setFormConfig(prev => ({ ...prev, types: tipos, validations: null }));
        } else {
            setFormConfig({ types: null, validations: null });
        }
    };

    const getTypeValidations = (typeValue: string, componentValue: string) => {
        const selectedComponent = FIELD_COMPONENTS.find((c) => c.value === componentValue);
        const selectedType = selectedComponent?.types?.find((t) => t.type === typeValue)?.validations;

        if (selectedType) {
            setFormConfig(prev => ({ ...prev, validations: selectedType }));
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        closeModal?.();
    }

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };


    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => { if (!open) closeModal?.(); }}
        >
            <Modal.Backdrop variant="blur">
                <Modal.Container size="cover">
                    <Modal.Dialog className="w-[50%]" >
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="flex items-center gap-2">
                                <Modal.Icon><Gear className="size-5" /></Modal.Icon>
                                <Modal.Heading>Configuración</Modal.Heading>
                            </div>
                        </Modal.Header>
                        <Modal.Body>
                            <Form className="flex w-full  bg-overlay flex-col gap-4 p-8 border-2 border-default rounded-4xl" onSubmit={handleSubmit}>
                                <TextField
                                    name="title"
                                    type="text"
                                    value={form.title}
                                >
                                    <Label>Field Label</Label>
                                    <Input
                                        placeholder="The name shown above the input."
                                        onChange={handleInputChange}
                                    />
                                    <FieldError />
                                </TextField>

                                <TextField
                                    name="placeholder"
                                    type="text"
                                    value={form.placeholder}
                                >
                                    <Label>Hint Text</Label>
                                    <Input
                                        placeholder="Example text displayed inside the field."
                                        onChange={handleInputChange}
                                    />
                                    <FieldError />
                                </TextField>


                                <CustomSelect options={FIELD_COMPONENTS} name="componentType" label="Component Type" placeholder="Component Type" value={form.componentType} onChangeSelect={handleInputChange} />


                                <>
                                    <SimpleSelect isDisabled={!hasTypes} key={form.type} options={formConfig.types} value={form.type} onChangeSelect={handleInputChange} name="type" label="Type" placeholder="Type" />
                                </>



                                <>
                                    <CustomMultipleSelect isDisabled={!hasValidations} key={form.type} options={formConfig.validations} name="validations" label="Validations" placeholder="Validations" value={form.validations} onChangeSelect={handleInputChange} />
                                </>


                                <TextField
                                    name="value"
                                    type="text"
                                    value={form.value}
                                >
                                    <Label>Deafult Value</Label>
                                    <Input
                                        placeholder="Default value"
                                        onChange={handleInputChange}
                                    />
                                    <FieldError />
                                </TextField>

                                <div className="flex gap-2">
                                    <Button type="submit">
                                        <Check />
                                        Submit
                                    </Button>
                                    <Button type="reset" variant="secondary">
                                        Reset
                                    </Button>
                                </div>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={closeModal} type="button" variant="secondary">Cancel</Button>
                            <Button onClick={closeModal} type="button">Confirm</Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal >
    );
}