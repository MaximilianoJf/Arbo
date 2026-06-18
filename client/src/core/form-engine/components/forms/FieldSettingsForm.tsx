import { Plus, Check, CirclePlus, TrashBin } from "@gravity-ui/icons";
import { Form, Modal } from "@heroui/react";
import { FIELD_COMPONENTS } from "../../constants";
import { CustomMultipleSelect, CustomSelect, SimpleSelect } from "@/core/components";
import { useState, useEffect, useMemo, useContext } from "react";
import { FormContext } from "../../store";
import { useFormStore } from "../../store/useFormStore";

interface FieldSettingsFormProps {
    closeModal?: () => void;
    isOpen?: boolean;
}

interface SettingsFormState {
    title: string;
    placeholder: string;
    type: string;
    componentType: string;
    value: string;
    validations: string[];
    options: string[];
    newOption: string;
}

const COMPONENTS_WITH_OPTIONS = ["DynamicCheckbox", "DynamicSelect", "DynamicRadioGroup"];

// Shared input class
const inputCls =
    "w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-3)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:text-[var(--arbo-text-muted)] focus:outline-none focus:border-[var(--arbo-accent)] hover:border-[var(--arbo-border-light)] transition-colors";

const labelCls = "text-xs font-semibold arbo-text-secondary uppercase tracking-wider block mb-1.5";

export function FieldSettingsForm({ closeModal, isOpen }: FieldSettingsFormProps) {
    const context = useContext(FormContext);
    if (!context) throw new Error("FieldSettingsForm must be within FormProvider");

    const { addField } = useFormStore();

    const [form, setForm] = useState<SettingsFormState>({
        title: "",
        placeholder: "",
        type: "",
        componentType: "",
        value: "",
        validations: [],
        options: [],
        newOption: "",
    });

    const formConfig = useMemo(() => {
        const selectedComponent = FIELD_COMPONENTS.find((c) => c.value === form.componentType);
        const selectedType = selectedComponent?.types?.find((t) => t.type === form.type);
        return {
            types: (selectedComponent?.types?.map((t) => t.type) || []) as string[],
            validations: (selectedType?.validations || []) as string[],
        };
    }, [form.componentType, form.type]);

    useEffect(() => {
        if (form.componentType && !formConfig.types.includes(form.type)) {
            setForm((prev) => ({ ...prev, type: "", validations: [] }));
        }
    }, [form.componentType]);

    const needsOptions = COMPONENTS_WITH_OPTIONS.includes(form.componentType);
    const hasTypes = formConfig.types.length > 0;
    const hasValidations = formConfig.validations.length > 0;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const addOption = () => {
        const trimmed = form.newOption.trim();
        if (!trimmed || form.options.includes(trimmed)) return;
        setForm((prev) => ({ ...prev, options: [...prev.options, trimmed], newOption: "" }));
    };

    const removeOption = (opt: string) => {
        setForm((prev) => ({ ...prev, options: prev.options.filter((o) => o !== opt) }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        addField(e, form.options);
        setForm({ title: "", placeholder: "", type: "", componentType: "", value: "", validations: [], options: [], newOption: "" });
        closeModal?.();
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) closeModal?.(); }}>
            <Modal.Backdrop variant="blur">
                <Modal.Container size="cover">
                    <Modal.Dialog className="w-[480px] max-w-full">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="flex items-center gap-2">
                                <Modal.Icon>
                                    <Plus className="size-5" />
                                </Modal.Icon>
                                <Modal.Heading>Agregar Campo</Modal.Heading>
                            </div>
                        </Modal.Header>

                        <Modal.Body>
                            <Form
                                className="flex w-full flex-col gap-4"
                                onSubmit={handleSubmit}
                            >
                                {/* Label */}
                                <div>
                                    <label className={labelCls}>Label del campo</label>
                                    <input
                                        name="title"
                                        type="text"
                                        value={form.title}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Nombre completo"
                                        className={inputCls}
                                    />
                                </div>

                                {/* Placeholder */}
                                <div>
                                    <label className={labelCls}>Placeholder</label>
                                    <input
                                        name="placeholder"
                                        type="text"
                                        value={form.placeholder}
                                        onChange={handleInputChange}
                                        placeholder="Texto de ayuda dentro del campo"
                                        className={inputCls}
                                    />
                                </div>

                                {/* Component Type */}
                                <CustomSelect
                                    options={FIELD_COMPONENTS}
                                    name="componentType"
                                    label="Tipo de componente"
                                    placeholder="Seleccionar componente"
                                    value={form.componentType}
                                    onChangeSelect={handleInputChange}
                                />

                                {/* Type */}
                                <SimpleSelect
                                    isDisabled={!hasTypes}
                                    key={`type-${form.componentType}`}
                                    options={formConfig.types}
                                    value={form.type}
                                    onChangeSelect={handleInputChange}
                                    name="type"
                                    label="Tipo de dato"
                                    placeholder="Seleccionar tipo"
                                />

                                {/* Validations */}
                                <CustomMultipleSelect
                                    isDisabled={!hasValidations}
                                    key={`val-${form.type}`}
                                    options={formConfig.validations}
                                    name="validations"
                                    label="Validaciones"
                                    placeholder="Seleccionar validaciones"
                                    value={form.validations}
                                    onChangeSelect={handleInputChange}
                                />

                                {/* Options (checkbox / select) */}
                                {needsOptions && (
                                    <div>
                                        <label className={labelCls}>Opciones</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                name="newOption"
                                                value={form.newOption}
                                                onChange={handleInputChange}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                                                placeholder="Escribí una opción y presioná +"
                                                className={`${inputCls} flex-1`}
                                            />
                                            <button
                                                type="button"
                                                onClick={addOption}
                                                className="arbo-btn arbo-btn-secondary px-3"
                                                title="Agregar opción"
                                            >
                                                <CirclePlus className="size-4" />
                                            </button>
                                        </div>
                                        {form.options.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {form.options.map((opt) => (
                                                    <span
                                                        key={opt}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)] border border-[var(--arbo-accent)]/20"
                                                    >
                                                        {opt}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(opt)}
                                                            className="hover:text-[var(--arbo-danger)] transition-colors"
                                                        >
                                                            <TrashBin className="size-2.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs arbo-text-muted">Agrega al menos una opción para este campo.</p>
                                        )}
                                    </div>
                                )}

                                {/* Default Value */}
                                <div>
                                    <label className={labelCls}>Valor por defecto</label>
                                    <input
                                        name="value"
                                        type="text"
                                        value={form.value}
                                        onChange={handleInputChange}
                                        placeholder="Opcional"
                                        className={inputCls}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                    <button type="submit" className="arbo-btn arbo-btn-primary flex-1">
                                        <Check className="size-4" /> Agregar Campo
                                    </button>
                                    <button
                                        type="reset"
                                        onClick={() => setForm({ title: "", placeholder: "", type: "", componentType: "", value: "", validations: [], options: [], newOption: "" })}
                                        className="arbo-btn arbo-btn-secondary"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </Form>
                        </Modal.Body>

                        <Modal.Footer>
                            <button onClick={closeModal} type="button" className="arbo-btn arbo-btn-secondary text-sm">
                                Cerrar
                            </button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
