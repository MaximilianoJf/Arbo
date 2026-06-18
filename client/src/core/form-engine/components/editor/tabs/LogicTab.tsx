import { Xmark, BranchesRight } from "@gravity-ui/icons";
import { useEditorContext } from "../EditorContext";
import { OPERATOR_LABELS } from "../LogicCanvas";

/** Right-panel summary of the conditional logic (the diagram lives in the canvas). */
export const LogicTab = () => {
    const { schema, setSchema } = useEditorContext();
    const fields = schema.fields.filter((f) => !f.name?.startsWith("__page_break_"));

    const rules = fields.flatMap((target) => [
        ...(target.visibleWhen || []).map((cond, idx) => ({ target, cond, idx, kind: "visibleWhen" as const })),
        ...(target.hiddenWhen || []).map((cond, idx) => ({ target, cond, idx, kind: "hiddenWhen" as const })),
    ]);

    const removeCondition = (targetName: string, index: number, kind: "visibleWhen" | "hiddenWhen") => {
        setSchema((prev) => ({
            ...prev,
            fields: prev.fields.map((f) =>
                f.name === targetName
                    ? { ...f, [kind]: (f[kind] || []).filter((_, i) => i !== index) }
                    : f
            ),
        }));
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <BranchesRight className="size-4 text-[var(--arbo-accent)]" />
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Reglas activas ({rules.length})</label>
                </div>
                {rules.length === 0 ? (
                    <p className="text-xs arbo-text-muted">
                        Sin reglas todavía. En el diagrama, tocá la flecha de un campo, elegí la condición y luego hacé clic en el campo que se va a mostrar.
                    </p>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {rules.map(({ target, cond, idx, kind }) => {
                            const src = fields.find((f) => f.name === cond.field);
                            return (
                                <div key={`${target.name}-${kind}-${idx}`} className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                                    <p className="flex-1 text-[11px] arbo-text leading-snug">
                                        Si <strong className="text-[var(--arbo-accent)]">{src?.label || cond.field}</strong>{" "}
                                        {OPERATOR_LABELS[cond.operator]}
                                        {cond.operator !== "empty" && cond.operator !== "notEmpty" ? <> <strong>"{cond.value}"</strong></> : null}
                                        {" "}→ {kind === "visibleWhen"
                                            ? <span className="text-[var(--arbo-accent)]">mostrar</span>
                                            : <span className="text-[var(--arbo-danger)]">ocultar</span>}{" "}
                                        <strong>{target.label || target.name}</strong>
                                    </p>
                                    <button onClick={() => removeCondition(target.name, idx, kind)}
                                        className="p-1 rounded text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] shrink-0" title="Eliminar regla">
                                        <Xmark className="size-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="border-t border-[var(--arbo-border)] pt-3">
                <p className="text-[10px] arbo-text-muted leading-relaxed">
                    Los campos con condiciones quedan ocultos en el formulario publicado hasta que la respuesta del campo origen las cumpla.
                    Un campo puede tener varias condiciones: se muestra cuando se cumplen <strong className="arbo-text">todas</strong>.
                </p>
            </div>
        </div>
    );
};
