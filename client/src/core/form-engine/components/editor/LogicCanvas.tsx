import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { FormField } from "../../types";
import { useEditorContext } from "./EditorContext";
import { LogicFlowEditor } from "./LogicFlowEditor";

export { OPERATOR_LABELS } from "./LogicFlowEditor";

/**
 * Form-editor logic tab: React Flow canvas over the form's fields.
 * Component CREATION lives in the dedicated "Componentes" view — here you
 * only wire the logic of this form.
 */
export const LogicCanvas = () => {
    const { schema, setSchema } = useEditorContext();
    const navigate = useNavigate();
    const fields = schema.fields.filter((f) => !f.name?.startsWith("__page_break_"));

    const onFieldsChange = useCallback((updater: (f: FormField[]) => FormField[]) => {
        setSchema((prev) => ({ ...prev, fields: updater(prev.fields) }));
    }, [setSchema]);

    return (
        <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden border border-[var(--arbo-border)]">
            <div className="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-[var(--arbo-border)] flex-wrap" style={{ background: "var(--arbo-surface-3)" }}>
                <span className="text-[11px] arbo-text-muted">
                    Arrastrá desde el punto <span className="text-[var(--arbo-accent)]">verde</span> (derecha) hacia el punto <span className="text-[var(--arbo-text-secondary)]">gris</span> (izquierda) del campo que se va a mostrar u ocultar.
                    Podés conectar múltiples campos al mismo destino. Clic en la flecha para configurar la condición.
                </span>
                <button
                    onClick={() => navigate("/form-builder/components")}
                    className="ml-auto px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-muted hover:arbo-text transition-colors"
                    title="Los componentes reutilizables se crean en su propia sección"
                >
                    Crear componentes →
                </button>
            </div>

            <div className="flex-1 min-h-0" style={{ minHeight: 420 }}>
                {fields.length === 0 ? (
                    <p className="text-sm arbo-text-muted text-center py-16">Agregá campos al formulario para conectar su lógica.</p>
                ) : (
                    <LogicFlowEditor fields={fields} onFieldsChange={onFieldsChange} />
                )}
            </div>
        </div>
    );
};
