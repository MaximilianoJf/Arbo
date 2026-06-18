import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Sliders, CircleCheck, FloppyDisk, ArrowsRotateLeft, Plus, Heading, FileText, Hashtag,
    ChartColumn, ChartBar, ChartPie, ChartDonut, ChartLine, LayoutCells,
    Calendar, ArrowDownToLine, TrashBin,
} from "@gravity-ui/icons";
import { formApi } from "@/services/api";
import { DashboardCanvas } from "./DashboardCanvas";
import { DashboardView } from "./DashboardView";
import { WidgetInspector } from "./WidgetInspector";
import {
    type DashboardDesign, type DashWidget, type DesignerField, type WidgetKind,
    buildDefaultDesign, normalizeDesign, createWidget, createFieldWidget, clamp,
} from "./types";
import type { ResponseLike } from "./aggregations";
import { applyFilters, distinctValues, hasActiveFilters, type DashboardFilters } from "./filters";
import { exportToPng, exportToPdf, exportToHtml } from "./exportDashboard";
import { BackgroundPanel } from "./BackgroundPanel";

interface Props {
    formId: number;
    formTitle: string;
    fields: DesignerField[];
    responses: ResponseLike[];
    initial?: any;
    defaultAccent?: string;
    onSaved: (design: DashboardDesign) => void;
}

const PALETTE_VISUALS: { kind: WidgetKind; icon: React.ReactNode; label: string }[] = [
    { kind: "kpi", icon: <Hashtag className="size-3.5" />, label: "Métrica KPI" },
    { kind: "stats", icon: <LayoutCells className="size-3.5" />, label: "Resumen num." },
    { kind: "bar", icon: <ChartColumn className="size-3.5" />, label: "Barras" },
    { kind: "hbar", icon: <ChartBar className="size-3.5" />, label: "Barras horiz." },
    { kind: "pie", icon: <ChartPie className="size-3.5" />, label: "Torta" },
    { kind: "doughnut", icon: <ChartDonut className="size-3.5" />, label: "Dona" },
    { kind: "line", icon: <ChartLine className="size-3.5" />, label: "Línea" },
    { kind: "table", icon: <LayoutCells className="size-3.5" />, label: "Tabla" },
];

const PaletteBtn = ({ icon, label, onClick, title }: { icon: React.ReactNode; label: string; onClick: () => void; title?: string }) => (
    <button
        onClick={onClick}
        title={title}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs text-left transition-all cursor-pointer active:scale-95 bg-[var(--arbo-surface-2)] border-[var(--arbo-border)] arbo-text-secondary hover:arbo-text hover:border-[var(--arbo-accent)]/40"
    >
        {icon}<span className="truncate">{label}</span>
    </button>
);

const inputCls = "px-2 py-1 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-xs arbo-text focus:outline-none focus:border-[var(--arbo-accent)]";

export const DashboardTab = ({ formId, formTitle, fields, responses, initial, defaultAccent = "#4ADE80", onSaved }: Props) => {
    const [design, setDesign] = useState<DashboardDesign>(() =>
        initial ? normalizeDesign(fields, initial, defaultAccent) : buildDefaultDesign(fields, defaultAccent));
    const [editing, setEditing] = useState(!initial);   // start in edit mode when there's nothing saved yet
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filters, setFilters] = useState<DashboardFilters>({});
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState<"png" | "pdf" | "html" | null>(null);
    const viewRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => applyFilters(responses, filters), [responses, filters]);
    const selectedWidget = useMemo(() => design.widgets.find((w) => w.id === selectedId) || null, [design.widgets, selectedId]);
    const bottomY = useCallback((d: DashboardDesign) => d.widgets.reduce((m, w) => Math.max(m, w.y + w.h), 0), []);

    const mutate = (fn: (d: DashboardDesign) => DashboardDesign) => { setDesign(fn); setDirty(true); };

    const addWidget = (factory: (y: number) => DashWidget) => {
        const id = crypto.randomUUID();
        mutate((d) => {
            const y = clamp(bottomY(d), 0, Math.max(0, d.rows - 1));
            const widget = { ...factory(y), id };
            const rows = Math.max(d.rows, widget.y + widget.h);
            return { ...d, rows, widgets: [...d.widgets, widget] };
        });
        setSelectedId(id);
        setError(null);
    };

    const addVisual = (kind: WidgetKind) => addWidget((y) => createWidget(kind, null, y, design.accent));
    const addFieldWidget = (field: DesignerField) => addWidget((y) => createFieldWidget(field, y, design.accent));

    const updateWidget = useCallback((id: string, patch: Partial<DashWidget>) => {
        setDesign((d) => ({ ...d, widgets: d.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
        setDirty(true);
    }, []);
    const updateSelected = useCallback((patch: Partial<DashWidget>) => { if (selectedId) updateWidget(selectedId, patch); }, [selectedId, updateWidget]);

    const deleteSelected = useCallback(() => {
        if (!selectedId) return;
        setDesign((d) => ({ ...d, widgets: d.widgets.filter((w) => w.id !== selectedId) }));
        setSelectedId(null);
        setDirty(true);
    }, [selectedId]);

    const duplicateSelected = useCallback(() => {
        if (!selectedWidget) return;
        const copy: DashWidget = { ...selectedWidget, id: crypto.randomUUID(), x: clamp(selectedWidget.x + 1, 0, design.cols - selectedWidget.w), y: selectedWidget.y + selectedWidget.h };
        mutate((d) => ({ ...d, rows: Math.max(d.rows, copy.y + copy.h), widgets: [...d.widgets, copy] }));
        setSelectedId(copy.id);
    }, [selectedWidget, design.cols]);

    const setRows = (rows: number) => mutate((d) => ({ ...d, rows: clamp(rows, 4, 60) }));

    const handleReset = () => { setDesign(buildDefaultDesign(fields, defaultAccent)); setSelectedId(null); setDirty(true); };

    const handleSave = async () => {
        setSaving(true); setError(null);
        try {
            await formApi.saveDashboardLayout(formId, design);
            onSaved(design);
            setDirty(false);
            setEditing(false);
        } catch (e: any) {
            setError(e.message || "Error al guardar el dashboard");
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async (kind: "png" | "pdf" | "html") => {
        if (!viewRef.current) return;
        setExporting(kind);
        try {
            const safe = (formTitle || "dashboard").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
            if (kind === "png") await exportToPng(viewRef.current, `${safe}.png`);
            else if (kind === "html") exportToHtml(viewRef.current, `${safe}.html`, formTitle || "Dashboard");
            else exportToPdf(viewRef.current, formTitle || "Dashboard");
        } catch (e: any) {
            setError(e.message || "Error al exportar");
        } finally {
            setExporting(null);
        }
    };

    // Delete key in edit mode
    useEffect(() => {
        if (!editing) return;
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
            if ((e.key === "Delete" || e.key === "Backspace") && selectedId) { e.preventDefault(); deleteSelected(); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [editing, selectedId, deleteSelected]);

    const filterFields = fields.filter((f) => !!f.name);
    const valueOptions = filters.fieldName ? distinctValues(responses, filters.fieldName) : [];

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar */}
            <div className="arbo-panel p-3 flex flex-wrap items-center gap-3">
                <button
                    onClick={() => { setEditing((v) => !v); setSelectedId(null); }}
                    className={`arbo-btn text-xs py-1.5 px-3 ${editing ? "arbo-btn-primary" : "arbo-btn-secondary"}`}
                >
                    {editing ? <><CircleCheck className="size-3.5" /> Listo</> : <><Sliders className="size-3.5" /> Editar</>}
                </button>

                {/* Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Calendar className="size-3.5 arbo-text-muted" />
                    <input type="date" value={filters.from || ""} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))} className={inputCls} title="Desde" />
                    <span className="arbo-text-muted text-xs">→</span>
                    <input type="date" value={filters.to || ""} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))} className={inputCls} title="Hasta" />
                    <select value={filters.fieldName || ""} onChange={(e) => setFilters((f) => ({ ...f, fieldName: e.target.value || undefined, value: undefined }))} className={inputCls}>
                        <option value="">Campo…</option>
                        {filterFields.map((f) => <option key={f.name} value={f.name}>{f.label || f.name}</option>)}
                    </select>
                    {filters.fieldName && (
                        <select value={filters.value || ""} onChange={(e) => setFilters((f) => ({ ...f, value: e.target.value || undefined }))} className={inputCls}>
                            <option value="">Valor…</option>
                            {valueOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    )}
                    {hasActiveFilters(filters) && (
                        <button onClick={() => setFilters({})} className="text-xs arbo-text-muted hover:arbo-text flex items-center gap-1" title="Limpiar filtros">
                            <TrashBin className="size-3.5" /> {filtered.length}/{responses.length}
                        </button>
                    )}
                </div>

                <div className="flex-1" />

                {error && <span className="text-xs text-[var(--arbo-danger)]">{error}</span>}

                {/* Export (clean view only) */}
                {!editing && (
                    <>
                        <button onClick={() => handleExport("html")} disabled={!!exporting} className="arbo-btn arbo-btn-ghost text-xs py-1.5 px-3 disabled:opacity-50" title="Exportar como página HTML independiente">
                            <ArrowDownToLine className="size-3.5" /> {exporting === "html" ? "…" : "HTML"}
                        </button>
                        <button onClick={() => handleExport("pdf")} disabled={!!exporting} className="arbo-btn arbo-btn-ghost text-xs py-1.5 px-3 disabled:opacity-50" title="Exportar a PDF (imprimir → Guardar como PDF)">
                            <ArrowDownToLine className="size-3.5" /> {exporting === "pdf" ? "…" : "PDF"}
                        </button>
                        <button onClick={() => handleExport("png")} disabled={!!exporting} className="arbo-btn arbo-btn-ghost text-xs py-1.5 px-3 disabled:opacity-50" title="Exportar como imagen PNG">
                            <ArrowDownToLine className="size-3.5" /> {exporting === "png" ? "…" : "Imagen"}
                        </button>
                    </>
                )}

                {/* Save */}
                {editing && (
                    <>
                        <button onClick={handleReset} className="arbo-btn arbo-btn-ghost text-xs py-1.5 px-3"><ArrowsRotateLeft className="size-3.5" /> Restablecer</button>
                        <button onClick={handleSave} disabled={saving} className="arbo-btn arbo-btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
                            <FloppyDisk className="size-3.5" /> {saving ? "Guardando…" : dirty ? "Guardar*" : "Guardar"}
                        </button>
                    </>
                )}
            </div>

            {/* Body */}
            {editing ? (
                <div className="flex gap-3 items-start">
                    {/* Palette */}
                    <div className="arbo-panel w-44 shrink-0 flex flex-col p-3 gap-3 max-h-[75vh] overflow-y-auto">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Visuales</span>
                            {PALETTE_VISUALS.map((p) => <PaletteBtn key={p.kind} icon={p.icon} label={p.label} onClick={() => addVisual(p.kind)} />)}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Texto</span>
                            <PaletteBtn icon={<Heading className="size-3.5" />} label="Título" onClick={() => addVisual("title")} />
                            <PaletteBtn icon={<FileText className="size-3.5" />} label="Texto libre" onClick={() => addVisual("text")} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Campos</span>
                            {fields.length === 0 && <p className="text-[10px] arbo-text-muted">Sin campos</p>}
                            {fields.map((f) => (
                                <PaletteBtn key={f.name} icon={<Plus className="size-3 shrink-0 opacity-60" />} label={f.label || f.name} onClick={() => addFieldWidget(f)} title="Agregar visual sugerido" />
                            ))}
                        </div>
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--arbo-border)]">
                            <label className="flex items-center justify-between text-[10px] arbo-text-muted">
                                Filas
                                <span className="flex items-center gap-1">
                                    <button onClick={() => setRows(design.rows - 1)} className="size-5 rounded bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">−</button>
                                    <span className="font-mono arbo-text w-5 text-center">{design.rows}</span>
                                    <button onClick={() => setRows(design.rows + 1)} className="size-5 rounded bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">+</button>
                                </span>
                            </label>
                            <label className="flex items-center justify-between text-[10px] arbo-text-muted cursor-pointer">
                                Acento
                                <input type="color" value={design.accent || "#4ADE80"} onChange={(e) => mutate((d) => ({ ...d, accent: e.target.value }))} className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
                            </label>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--arbo-border)]">
                            <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Fondo</span>
                            <BackgroundPanel design={design} onChange={(patch) => mutate((d) => ({ ...d, ...patch }))} />
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 min-w-0">
                        <DashboardCanvas
                            design={design}
                            fields={fields}
                            responses={filtered}
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                            onChange={updateWidget}
                        />
                        <p className="text-[10px] arbo-text-muted text-center mt-2">Arrastrá para mover · tirá de los puntos para redimensionar · Supr para borrar</p>
                    </div>

                    {/* Inspector */}
                    <div className="arbo-panel w-56 shrink-0 max-h-[75vh] overflow-y-auto">
                        <WidgetInspector widget={selectedWidget} fields={fields} onChange={updateSelected} onDelete={deleteSelected} onDuplicate={duplicateSelected} />
                    </div>
                </div>
            ) : (
                <div ref={viewRef} className="rounded-xl border border-[var(--arbo-border)] p-2 overflow-hidden">
                    <DashboardView design={design} fields={fields} responses={filtered} />
                </div>
            )}
        </div>
    );
};
