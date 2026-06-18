import { useState } from "react";
import { Label, Input, FieldError } from "@heroui/react";
import type { FormField } from "../../types";
import { FieldRenderMap } from "../Field-render";
import { isFieldVisible } from "../../utils/field-logic";
import { FieldGridLayout } from "./FieldGridLayout";

interface BlockPreviewProps {
    fields: FormField[];
}

/**
 * Interactive preview of a composite component: renders the fields like the
 * published form and applies the conditional logic live, so you can answer
 * the source fields and watch the connected ones appear/disappear.
 */
export const BlockPreview = ({ fields }: BlockPreviewProps) => {
    const [values, setValues] = useState<Record<string, string | number>>({});

    const formState = Object.fromEntries(
        fields.map((f) => [f.name, { value: values[f.name] ?? "", error: null }])
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };

    const visible = fields.filter((f) => isFieldVisible(f, values));

    const renderItem = (field: FormField) => {
        const Component = FieldRenderMap[field.componentType]?.component;
        if (!Component) return null;
        return (
            <Component
                formState={formState}
                required={field.required}
                name={field.name}
                type={field.type}
                validate={field.validate}
                handleInputChange={handleInputChange}
                placeholder={field.placeholder}
                label={field.label}
                options={field.options}
                rows={field.rows}
                accept={field.accept}
            >
                <Label>{field.label}</Label>
                <Input placeholder={field.placeholder} />
                <FieldError />
            </Component>
        );
    };

    if (fields.length === 0) {
        return <p className="text-sm arbo-text-muted text-center py-16">Agregá campos para previsualizar el componente.</p>;
    }

    return (
        <div className="h-full overflow-auto p-6" style={{ background: "var(--arbo-surface)" }}>
            <div className="mx-auto max-w-xl rounded-2xl border border-[var(--arbo-border)] p-6" style={{ background: "var(--arbo-surface-2)" }}>
                <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider mb-4">
                    Vista previa interactiva — respondé y mirá cómo reacciona la lógica
                </p>
                <FieldGridLayout fields={visible} renderItem={renderItem} />
                {visible.length < fields.length && (
                    <p className="text-[10px] arbo-text-muted mt-4">
                        {fields.length - visible.length} campo(s) oculto(s) esperando su condición.
                    </p>
                )}
                <button
                    onClick={() => setValues({})}
                    className="mt-4 text-[10px] arbo-text-muted hover:text-[var(--arbo-accent)] transition-colors"
                >
                    Reiniciar respuestas
                </button>
            </div>
        </div>
    );
};
