// ─── Right-panel config for the selected widget ───

import type { DashWidget, DesignerField, WidgetKind, KpiMetric } from "./types";
import { KIND_LABELS, METRIC_LABELS, isNumericField } from "./types";

interface Props {
    widget: DashWidget | null;
    fields: DesignerField[];
    onChange: (patch: Partial<DashWidget>) => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">{label}</span>
        {children}
    </label>
);

const selectCls = "w-full px-2 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-xs arbo-text focus:outline-none focus:border-[var(--arbo-accent)]";

// Which widget kinds are valid for the bound field type
const CHART_KINDS: WidgetKind[] = ["kpi", "stats", "bar", "hbar", "pie", "doughnut", "line", "table"];

export const WidgetInspector = ({ widget, fields, onChange, onDelete, onDuplicate }: Props) => {
    if (!widget) {
        return (
            <div className="p-4 text-xs arbo-text-muted">
                Seleccioná un widget para editarlo, o agregá uno desde la paleta.
            </div>
        );
    }

    const field = fields.find((f) => f.name === widget.fieldName);
    const isTextual = widget.kind === "title" || widget.kind === "text";
    const isChart = ["bar", "hbar", "pie", "doughnut", "line"].includes(widget.kind);
    const isPie = widget.kind === "pie" || widget.kind === "doughnut";

    return (
        <div className="flex flex-col gap-3 p-3 overflow-y-auto">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold arbo-text">{KIND_LABELS[widget.kind]}</span>
                <div className="flex items-center gap-1">
                    <button onClick={onDuplicate} className="text-[10px] px-2 py-1 rounded bg-[var(--arbo-surface-2)] arbo-text-muted hover:arbo-text border border-[var(--arbo-border)]">Duplicar</button>
                    <button onClick={onDelete} className="text-[10px] px-2 py-1 rounded bg-[var(--arbo-danger-muted)] text-[var(--arbo-danger)]">Borrar</button>
                </div>
            </div>

            {/* Text widgets */}
            {isTextual && (
                <Row label="Texto">
                    <textarea
                        value={widget.text || ""}
                        onChange={(e) => onChange({ text: e.target.value })}
                        rows={2}
                        className={selectCls + " resize-none"}
                    />
                </Row>
            )}

            {/* Widget kind switch (for data widgets) */}
            {!isTextual && (
                <Row label="Tipo de visual">
                    <select value={widget.kind} onChange={(e) => onChange({ kind: e.target.value as WidgetKind })} className={selectCls}>
                        {CHART_KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
                    </select>
                </Row>
            )}

            {/* Field binding */}
            {!isTextual && (
                <Row label="Campo / fuente">
                    <select value={widget.fieldName || ""} onChange={(e) => onChange({ fieldName: e.target.value || undefined })} className={selectCls}>
                        <option value="">{widget.kind === "kpi" ? "Total de respuestas" : "— elegir campo —"}</option>
                        {fields.map((f) => <option key={f.name} value={f.name}>{f.label || f.name}</option>)}
                    </select>
                </Row>
            )}

            {/* KPI metric */}
            {widget.kind === "kpi" && (
                <Row label="Métrica">
                    <select value={widget.metric || "responses"} onChange={(e) => onChange({ metric: e.target.value as KpiMetric })} className={selectCls}>
                        <option value="responses">{METRIC_LABELS.responses}</option>
                        <option value="answered">{METRIC_LABELS.answered}</option>
                        {isNumericField(field) && (["sum", "avg", "min", "max"] as KpiMetric[]).map((m) => (
                            <option key={m} value={m}>{METRIC_LABELS[m]}</option>
                        ))}
                    </select>
                </Row>
            )}

            {/* Title / label */}
            {!isTextual && (
                <Row label="Título del widget">
                    <input
                        value={widget.title || ""}
                        onChange={(e) => onChange({ title: e.target.value })}
                        placeholder={field?.label || "Título"}
                        className={selectCls}
                    />
                </Row>
            )}

            {/* KPI icon */}
            {widget.kind === "kpi" && (
                <Row label="Icono (emoji)">
                    <input value={widget.icon || ""} onChange={(e) => onChange({ icon: e.target.value })} placeholder="📊" className={selectCls} />
                </Row>
            )}

            {/* Color */}
            <Row label="Color">
                <input type="color" value={widget.color || "#4ADE80"} onChange={(e) => onChange({ color: e.target.value })} className="h-8 w-full rounded-lg cursor-pointer border border-[var(--arbo-border)] bg-transparent" />
            </Row>

            {/* Limit (charts/table) */}
            {(isChart || widget.kind === "table") && widget.kind !== "line" && (
                <Row label={`Máx. categorías: ${widget.limit ?? 8}`}>
                    <input type="range" min={3} max={15} value={widget.limit ?? 8} onChange={(e) => onChange({ limit: Number(e.target.value) })} className="w-full accent-[var(--arbo-accent)]" />
                </Row>
            )}

            {/* Toggles */}
            {isChart && widget.kind !== "pie" && widget.kind !== "doughnut" && (
                <label className="flex items-center gap-2 text-xs arbo-text-secondary cursor-pointer">
                    <input type="checkbox" checked={!!widget.showValues} onChange={(e) => onChange({ showValues: e.target.checked })} />
                    Mostrar valores
                </label>
            )}
            {isPie && (
                <label className="flex items-center gap-2 text-xs arbo-text-secondary cursor-pointer">
                    <input type="checkbox" checked={!!widget.showLegend} onChange={(e) => onChange({ showLegend: e.target.checked })} />
                    Mostrar leyenda
                </label>
            )}

            {/* Size readout */}
            <div className="text-[10px] arbo-text-muted pt-2 border-t border-[var(--arbo-border)]">
                {widget.w} × {widget.h} celdas · pos ({widget.x}, {widget.y})
            </div>
        </div>
    );
};
