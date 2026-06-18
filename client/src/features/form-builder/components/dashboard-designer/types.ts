// ─── Dashboard visual designer model ───
// A drag-and-drop dashboard built on a column grid, Power BI style but simpler.

import type { GlowOrb } from "@/core/form-engine/types/schema.types";
export type { GlowOrb };

export type WidgetKind =
    | "kpi"        // single big number
    | "bar"        // vertical bar chart
    | "hbar"       // horizontal bar chart
    | "pie"        // pie chart
    | "doughnut"   // doughnut chart
    | "line"       // line chart (timeline)
    | "table"      // top categories / values table
    | "stats"      // numeric summary: sum / avg / min / max / count
    | "title"      // big heading text
    | "text";      // free static text

/** KPI metric over a field (or over the whole form for "responses"). */
export type KpiMetric = "responses" | "answered" | "sum" | "avg" | "min" | "max";

export interface DashWidget {
    id: string;
    kind: WidgetKind;
    // Grid position (column/row units, 0-based)
    x: number;
    y: number;
    w: number;
    h: number;
    // Data binding (charts / kpi / table)
    fieldName?: string;
    metric?: KpiMetric;      // for kind="kpi"
    // Presentation
    title?: string;          // custom title; falls back to the field label
    text?: string;           // for kind="title" / "text"
    color?: string;          // accent color of the widget
    icon?: string;           // emoji for kpi
    showLegend?: boolean;    // pie/doughnut legend
    showValues?: boolean;    // show numbers on bars / slices
    limit?: number;          // max categories (bar/pie/table)
}

export interface DashboardDesign {
    version: 1;
    cols: number;            // grid columns
    rows: number;            // grid rows (canvas height)
    bg?: string;             // canvas base background color
    accent?: string;         // default accent for new widgets
    title?: string;          // dashboard heading
    widgets: DashWidget[];
    // ── Background decoration (same model as the form page) ──
    glowEnabled?: boolean;
    glowOrbs?: GlowOrb[];
    gradient?: string;       // a CSS gradient string painted over the base
    bgImage?: string;        // url or data-URL
    bgImageFit?: "cover" | "contain";
    bgImageOpacity?: number; // 0–100
    bgImagePosX?: number;    // 0–100
    bgImagePosY?: number;    // 0–100
}

/** Curated gradient presets for the dashboard background. */
export const GRADIENT_PRESETS: { name: string; css: string }[] = [
    { name: "Aurora", css: "linear-gradient(135deg, #0c0c18 0%, #14233b 50%, #0c2a24 100%)" },
    { name: "Noche", css: "linear-gradient(160deg, #0a0a14 0%, #1a1030 100%)" },
    { name: "Océano", css: "linear-gradient(135deg, #08131f 0%, #0a2a3a 100%)" },
    { name: "Atardecer", css: "linear-gradient(135deg, #1a0f1f 0%, #3a1320 60%, #3a2410 100%)" },
    { name: "Bosque", css: "linear-gradient(135deg, #0a140e 0%, #112b1e 100%)" },
    { name: "Carbón", css: "linear-gradient(180deg, #0e0e14 0%, #1a1a22 100%)" },
];

/** Composes the dashboard background CSS: glow orbs over image over gradient/base. */
export const getDashboardBgCss = (d: DashboardDesign): string => {
    const base = d.bg || "#0c0c18";
    const layers: string[] = [];

    if (d.glowEnabled && d.glowOrbs?.length) {
        for (const orb of d.glowOrbs) {
            const a = Math.max(0, Math.min(1, orb.opacity / 100));
            const rgba = hexToRgba(orb.color, a);
            layers.push(`radial-gradient(ellipse ${orb.size}% ${Math.round(orb.size * 0.65)}% at ${orb.x}% ${orb.y}%, ${rgba} 0%, transparent 70%)`);
        }
    }

    if (d.bgImage) {
        const fit = d.bgImageFit || "cover";
        const posX = d.bgImagePosX ?? 50;
        const posY = d.bgImagePosY ?? 50;
        const opacity = d.bgImageOpacity ?? 100;
        if (opacity < 100) {
            const veil = hexToRgba(base, 1 - opacity / 100);
            layers.push(`linear-gradient(${veil}, ${veil})`);
        }
        layers.push(`url("${d.bgImage}") ${posX}% ${posY}%/${fit} no-repeat`);
    }

    if (d.gradient) layers.push(d.gradient);
    layers.push(base);
    return layers.join(", ");
};

/** hex (#rrggbb) → rgba(); passes through rgb()/var() unchanged. */
function hexToRgba(color: string, alpha: number): string {
    if (!color || color.startsWith("var(") || color.startsWith("rgb")) return color;
    const clean = color.replace("#", "");
    if (clean.length !== 6) return color;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export interface DesignerField {
    name: string;
    label?: string;
    componentType?: string;
    type?: string;
    options?: any[];
}

export const DEFAULT_COLS = 12;
export const DEFAULT_ROWS = 12;
export const ROW_H = 56;          // px per row unit
export const DEFAULT_ACCENT = "#4ADE80";

// Vibrant palette for chart series (matches the AI HTML dashboard).
export const PALETTE = [
    "#4ADE80", "#60A5FA", "#F472B6", "#FACC15", "#A78BFA",
    "#34D399", "#FB923C", "#38BDF8", "#E879F9", "#86EFAC",
];

export const KIND_LABELS: Record<WidgetKind, string> = {
    kpi: "Métrica (KPI)",
    bar: "Barras",
    hbar: "Barras horizontales",
    pie: "Torta",
    doughnut: "Dona",
    line: "Línea (tiempo)",
    table: "Tabla",
    stats: "Resumen numérico",
    title: "Título",
    text: "Texto",
};

export const METRIC_LABELS: Record<KpiMetric, string> = {
    responses: "Total de respuestas",
    answered: "Respuestas con dato",
    sum: "Suma",
    avg: "Promedio",
    min: "Mínimo",
    max: "Máximo",
};

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const uid = () => (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

/** True when the field holds numeric answers (sum/avg/min/max apply). */
export const isNumericField = (f?: DesignerField) =>
    !!f && (f.type === "number" || f.componentType === "DynamicNumberField");

/** True when the field has discrete options (good for pie/bar distribution). */
export const isCategoricalField = (f?: DesignerField) =>
    !!f && ["DynamicSelect", "DynamicRadioGroup", "DynamicCheckbox", "DynamicCheckboxGroup", "DynamicMultiSelect"].includes(f.componentType || "");

export const isDateField = (f?: DesignerField) =>
    !!f && (f.componentType === "DynamicDateField" || f.type === "date");

/** Suggest the best widget kind for a field when dropped from the palette. */
export const suggestKind = (f: DesignerField): WidgetKind => {
    if (isDateField(f)) return "line";
    if (isNumericField(f)) return "kpi";
    if (isCategoricalField(f)) {
        const optCount = (f.options || []).length;
        return optCount > 0 && optCount <= 6 ? "pie" : "bar";
    }
    return "table";
};

const makeWidget = (kind: WidgetKind, field: DesignerField | null, x: number, y: number, accent: string): DashWidget => {
    const base: DashWidget = { id: uid(), kind, x, y, w: 3, h: 2, color: accent };
    if (kind === "kpi") return { ...base, w: 3, h: 2, fieldName: field?.name, metric: field && isNumericField(field) ? "avg" : "responses", icon: "📊", title: field?.label || field?.name };
    if (kind === "title") return { ...base, w: 12, h: 1, text: "Dashboard de respuestas" };
    if (kind === "text") return { ...base, w: 4, h: 1, text: "Texto" };
    if (kind === "table") return { ...base, w: 4, h: 4, fieldName: field?.name, title: field?.label || field?.name, limit: 8 };
    if (kind === "stats") return { ...base, w: 6, h: 2, fieldName: field?.name, title: field?.label || field?.name };
    if (kind === "line") return { ...base, w: 6, h: 3, fieldName: field?.name, title: field?.label || field?.name, showValues: true };
    if (kind === "pie" || kind === "doughnut") return { ...base, w: 4, h: 4, fieldName: field?.name, title: field?.label || field?.name, showLegend: true, limit: 7 };
    // bar / hbar
    return { ...base, w: 6, h: 3, fieldName: field?.name, title: field?.label || field?.name, showValues: true, limit: 8 };
};

/** Create a widget for a palette click, placed at the given row. */
export const createWidget = (kind: WidgetKind, field: DesignerField | null, y: number, accent = DEFAULT_ACCENT): DashWidget =>
    makeWidget(kind, field, 0, y, accent);

/** Create a field widget using the suggested kind. */
export const createFieldWidget = (field: DesignerField, y: number, accent = DEFAULT_ACCENT): DashWidget =>
    makeWidget(suggestKind(field), field, 0, y, accent);

export const buildDefaultDesign = (fields: DesignerField[], accent = DEFAULT_ACCENT): DashboardDesign => {
    const widgets: DashWidget[] = [];
    // Title row
    widgets.push({ id: uid(), kind: "title", x: 0, y: 0, w: DEFAULT_COLS, h: 1, text: "Dashboard de respuestas", color: accent });
    // Total responses KPI
    widgets.push({ id: uid(), kind: "kpi", x: 0, y: 1, w: 3, h: 2, metric: "responses", icon: "📋", title: "Respuestas", color: accent });

    // A couple of charts from the first suitable fields
    let placedX = 3, placedY = 1;
    const chartFields = fields.filter((f) => isCategoricalField(f) || isNumericField(f) || isDateField(f)).slice(0, 3);
    for (const f of chartFields) {
        const w = makeWidget(suggestKind(f), f, placedX, placedY, accent);
        // simple flow layout
        if (placedX + w.w > DEFAULT_COLS) { placedX = 0; placedY += 3; }
        w.x = placedX; w.y = placedY;
        placedX += w.w;
        widgets.push(w);
    }

    const maxY = widgets.reduce((m, w) => Math.max(m, w.y + w.h), 0);
    return { version: 1, cols: DEFAULT_COLS, rows: Math.max(DEFAULT_ROWS, maxY), bg: "#0c0c18", accent, widgets };
};

/** Normalize a saved design; drop widgets whose bound field no longer exists. */
export const normalizeDesign = (fields: DesignerField[], saved: any, accent = DEFAULT_ACCENT): DashboardDesign => {
    if (!saved || saved.version !== 1 || !Array.isArray(saved.widgets)) {
        return buildDefaultDesign(fields, accent);
    }
    const valid = new Set(fields.map((f) => f.name));
    const cols = clamp(saved.cols ?? DEFAULT_COLS, 4, 24);
    const rows = clamp(saved.rows ?? DEFAULT_ROWS, 4, 60);
    const widgets: DashWidget[] = (saved.widgets as DashWidget[])
        .filter((w) => !w.fieldName || valid.has(w.fieldName) || w.kind === "title" || w.kind === "text")
        .map((w) => ({
            ...w,
            x: clamp(w.x ?? 0, 0, cols - 1),
            y: clamp(w.y ?? 0, 0, rows - 1),
            w: clamp(w.w ?? 3, 1, cols),
            h: clamp(w.h ?? 2, 1, rows),
        }));
    return {
        version: 1, cols, rows, bg: saved.bg || "#0c0c18", accent: saved.accent || accent, title: saved.title, widgets,
        glowEnabled: saved.glowEnabled,
        glowOrbs: Array.isArray(saved.glowOrbs) ? saved.glowOrbs : undefined,
        gradient: saved.gradient,
        bgImage: saved.bgImage,
        bgImageFit: saved.bgImageFit,
        bgImageOpacity: saved.bgImageOpacity,
        bgImagePosX: saved.bgImagePosX,
        bgImagePosY: saved.bgImagePosY,
    };
};
