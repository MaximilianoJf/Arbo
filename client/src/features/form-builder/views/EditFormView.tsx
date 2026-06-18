import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormBuilder } from "@/core/form-engine/FormBuilder";
import { formApi } from "@/services/api";
import type { FormSchema, FormField, ComponentType } from "@/core/form-engine/types";
import { applyFieldMeta } from "@/core/form-engine/utils/field-meta";

const mapApiFieldToSchema = (field: any): FormField => ({
    id: String(field.id),
    name: field.name,
    label: field.label || "",
    placeholder: field.placeholder || "",
    type: field.type,
    componentType: field.componentType as ComponentType,
    value: field.defaultValue || "",
    required: field.required || false,
    minLength: field.minLength,
    maxLength: field.maxLength,
    validate: field.validations || [],
    dependencies: field.dependencies || [],
    options: field.options || [],
    sortOrder: field.sortOrder || 0,
    page: field.page ?? 0,
    fieldStyles: field.fieldStyles || undefined,
    // Extended props (optionsSource, visibleWhen, pattern, rows, accept, span…) live in meta.
    ...applyFieldMeta(field),
});

export const EditFormView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [schema, setSchema] = useState<FormSchema | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await formApi.getById(Number(id));
                const form = res.data;
                const formSchema: FormSchema = {
                    id: form.id,
                    title: form.title,
                    description: form.description,
                    slug: form.slug,
                    onSubmit: form.onSubmit || undefined,
                    isPublished: form.isPublished,
                    styles: form.styles || undefined,
                    projectId: form.projectId ?? null,
                    fields: (form.fields || [])
                        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                        .map(mapApiFieldToSchema),
                };
                setSchema(formSchema);
            } catch {
                navigate("/form-builder");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    if (loading || !schema) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    return <FormBuilder formSchema={schema} mode="edit" isSystemForm={false} />;
};
