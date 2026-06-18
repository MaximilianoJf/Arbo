import type { FormField, FormStyles } from "../types";
import { Button, FieldError, Input, Label, Form } from "@heroui/react";
import { FieldRenderMap } from "./Field-render";
import { useFormStore } from "../store";
import { FORM_MODES } from "../constants/form-modes";
import { isColorLight } from "../utils/style-helpers";
import { useMemo, useState, useEffect } from "react";
import {
    EditorProvider,
    Navigator,
    EditorTabBar,
    EditorCanvas,
    LogicCanvas,
    PagePreviewCanvas,
    EmbedPreviewCanvas,
    InputsTab,
    FieldTab,
    FormStylesTab,
    PageTab,
    SubmitTab,
    EmbedTab,
    AITab,
    LogicTab,
} from "./editor";
import { FormViewMode } from "./FormViewMode";
import { FieldGridLayout } from "./ui/FieldGridLayout";
import { isFieldGridEnabled } from "../utils/field-grid";
import { isFieldVisible } from "../utils/field-logic";

interface DynamicFormProps {
    className?: string;
}

export const DynamicForm = ({ className }: DynamicFormProps) => {
    const {
        schema, setSchema, isSystemForm, schemaMode, setSchemaMode,
        formState, handleInputChange, handleSubmit,
    } = useFormStore();

    const isEditing = schemaMode === FORM_MODES.edit || schemaMode === FORM_MODES.create;
    const isPreview = schemaMode === FORM_MODES.preview;
    const styles = schema.styles || {};

    // Text colors derived from card bg
    const { cardTitleColor, cardSubColor } = useMemo(() => {
        const light = isColorLight(styles.bgColor || "#1a1a24");
        return {
            cardTitleColor: light ? "#1e293b" : "var(--arbo-text)",
            cardSubColor: light ? "#475569" : "var(--arbo-text-secondary)",
        };
    }, [styles.bgColor]);

    // --- Render helpers (depend on FieldRenderMap, so they stay in the orchestrator) ---
    const renderField = (field: FormField) => {
        if (field.name?.startsWith("__page_break_")) return null;
        const Component = FieldRenderMap[field.componentType]?.component ?? null;
        if (!Component) return null;

        // Merge: field-level styles override global styles
        const gfs = styles.globalFieldStyles;
        const fs = field.fieldStyles;
        const merged = (fs || gfs) ? { ...gfs, ...fs } : undefined;
        const hasStyles = merged && (
            merged.labelColor || merged.inputBgColor || merged.inputTextColor || merged.inputBorderColor ||
            merged.labelColorHover || merged.inputBgColorHover || merged.inputTextColorHover || merged.inputBorderColorHover
        );

        const cssVars = hasStyles ? {
            ...(merged.labelColor ? { "--field-label-color": merged.labelColor } : {}),
            ...(merged.inputBgColor ? { "--field-input-bg": merged.inputBgColor } : {}),
            ...(merged.inputTextColor ? { "--field-input-text": merged.inputTextColor } : {}),
            ...(merged.inputBorderColor ? { "--field-input-border": merged.inputBorderColor } : {}),
            ...(merged.labelColorHover ? { "--field-label-color-hover": merged.labelColorHover } : {}),
            ...(merged.inputBgColorHover ? { "--field-input-bg-hover": merged.inputBgColorHover } : {}),
            ...(merged.inputTextColorHover ? { "--field-input-text-hover": merged.inputTextColorHover } : {}),
            ...(merged.inputBorderColorHover ? { "--field-input-border-hover": merged.inputBorderColorHover } : {}),
        } as React.CSSProperties : undefined;

        const content = (
            <Component
                formState={formState} required={field.required} name={field.name}
                type={field.type} validate={field.validate} minLength={field.minLength}
                maxLength={field.maxLength} handleInputChange={handleInputChange}
                placeholder={field.placeholder} label={field.label} options={field.options}
                optionsSource={field.optionsSource} rows={field.rows} accept={field.accept}
            >
                <Label>{field.label}</Label>
                <Input placeholder={field.placeholder} />
                <FieldError />
            </Component>
        );

        if (hasStyles) {
            return <div className="arbo-field-styled" style={cssVars}>{content}</div>;
        }
        return content;
    };

    const renderViewFields = (fields: FormField[]) => {
        // Conditional logic: hide fields whose visibleWhen doesn't match the current answers
        const values = Object.fromEntries(Object.entries(formState).map(([k, s]) => [k, s.value]));
        const visible = fields.filter((f) => !f.name?.startsWith("__page_break_") && isFieldVisible(f, values));
        if (isFieldGridEnabled(styles)) {
            return <FieldGridLayout fields={visible} styles={styles} renderItem={renderField} />;
        }
        return visible.map((field) => <div key={field.name}>{renderField(field)}</div>);
    };

    // =====================
    //   SYSTEM FORM (Auth)
    // =====================
    if (isSystemForm) {
        return (
            <Form validationBehavior="aria" onSubmit={handleSubmit} className="flex flex-col gap-5">
                {schema.fields.map((field) => (
                    <div key={field.name}>{renderField(field)}</div>
                ))}
                {schema.onSubmit && <input type="hidden" name="actionType" value={schema.onSubmit} />}
                <div className="flex items-center gap-3 pt-3">
                    <Button className="arbo-btn-primary flex-1 py-2.5 text-sm" type="submit">
                        {schema.onSubmit === "__auth_login__" ? "Iniciar sesion" : "Crear cuenta"}
                    </Button>
                </div>
            </Form>
        );
    }

    // =====================
    //   EDITOR (3-panel)
    // =====================
    if (isEditing) {
        return (
            <EditorProvider renderField={renderField} renderViewFields={renderViewFields}>
                <EditorLayout className={className} />
            </EditorProvider>
        );
    }

    // =====================
    //  VIEW / PREVIEW MODE
    // =====================
    return (
        <FormViewMode
            schema={schema}
            styles={styles}
            handleSubmit={handleSubmit}
            renderViewFields={renderViewFields}
            isPreview={isPreview}
            setSchemaMode={(mode) => setSchemaMode(mode as Parameters<typeof setSchemaMode>[0])}
            cardTitleColor={cardTitleColor}
            cardSubColor={cardSubColor}
        />
    );
};

// --- Project selector for the save bar ---
import { projectApi } from "@/services/api";

const ProjectSelector = () => {
    const { projectId, setProjectId } = useEditorContextSafe();
    const [projects, setProjects] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        projectApi.getAll()
            .then((res) => setProjects(res.data.owned || []))
            .catch(() => {})
            .finally(() => setLoaded(true));
    }, []);

    if (!loaded || projects.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs arbo-text-muted">Proyecto:</span>
            <select
                value={projectId ?? ""}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                className="arbo-input text-xs py-1 px-2 w-40"
            >
                <option value="">Sin proyecto</option>
                {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
        </div>
    );
};

// --- Editor layout: uses EditorContext ---
const EditorLayout = ({ className = "" }: { className?: string }) => {
    const { rightTab, handleSaveForm, saveError, isSaving, savedOk, navigate } = useEditorContextSafe();

    return (
        <div className="flex gap-3 w-full" style={{ minHeight: "calc(100vh - 80px)" }}>
            {/* LEFT: Navigator */}
            <Navigator />

            {/* CENTER: Canvas */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-w-0">
                {(rightTab === "inputs" || rightTab === "field" || rightTab === "form" || rightTab === "ai") && (
                    <EditorCanvas className={className} />
                )}
                {rightTab === "logic" && <LogicCanvas />}
                {(rightTab === "page" || rightTab === "submit") && <PagePreviewCanvas />}
                {rightTab === "embed" && <EmbedPreviewCanvas />}

                {/* Save bar */}
                <div className="flex flex-col gap-1 pb-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={handleSaveForm} disabled={isSaving} className="arbo-btn arbo-btn-primary">
                            {isSaving ? "Guardando..." : "Guardar formulario"}
                        </button>
                        <button onClick={() => navigate("/form-builder")} className="arbo-btn arbo-btn-secondary">Cancelar</button>
                        {savedOk && (
                            <span className="text-xs text-green-400 px-1">Guardado</span>
                        )}
                        <div className="flex-1" />
                        <ProjectSelector />
                    </div>
                    {saveError && (
                        <p className="text-xs text-red-400 px-1">{saveError}</p>
                    )}
                </div>
            </div>

            {/* RIGHT: Tab panel — fixed height so AITab scroll works */}
            <div
                className="arbo-panel w-72 shrink-0 flex flex-col overflow-hidden self-start sticky top-0"
                style={{ height: "calc(100vh - 80px)" }}
            >
                <EditorTabBar />
                <div className={`flex-1 min-h-0 ${rightTab === "ai" ? "overflow-hidden" : "overflow-y-auto"} p-3`}>
                    {rightTab === "inputs" && <InputsTab />}
                    {rightTab === "field" && <FieldTab />}
                    {rightTab === "form" && <FormStylesTab />}
                    {rightTab === "page" && <PageTab />}
                    {rightTab === "submit" && <SubmitTab />}
                    {rightTab === "embed" && <EmbedTab />}
                    {rightTab === "ai" && <AITab />}
                    {rightTab === "logic" && <LogicTab />}
                </div>
            </div>
        </div>
    );
};

// Re-export for internal use — avoids circular import
import { useEditorContext as useEditorContextSafe } from "./editor/EditorContext";
