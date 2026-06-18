// ─── Client-side response aggregation for dashboard widgets ───
// Mirrors the server's aggregateField (dashboard.handler.ts) so the designer
// previews and the read-only view show identical, real data.

import type { DashWidget, DesignerField, KpiMetric } from "./types";

export interface ResponseLike {
    answers: Record<string, any>;
    respondentName?: string | null;
    respondentEmail?: string | null;
    createdAt?: string;
}

export interface Distribution {
    type: "distribution";
    labels: string[];
    values: number[];
    answered: number;
}
export interface Numeric {
    type: "numeric";
    count: number; min: number; max: number; avg: number; median: number; sum: number;
}
export interface Timeline {
    type: "timeline";
    labels: string[];
    values: number[];
    answered: number;
}
export interface TextAgg {
    type: "text";
    answered: number;
    samples: string[];
}
export interface EmptyAgg { type: "empty"; answered: 0; }

export type Aggregation = Distribution | Numeric | Timeline | TextAgg | EmptyAgg;

const cellValues = (field: DesignerField, responses: ResponseLike[]) =>
    responses
        .map((r) => r.answers?.[field.name])
        .filter((v) => v !== null && v !== undefined && v !== "");

const sortedDistribution = (counts: Record<string, number>): { labels: string[]; values: number[] } => {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { labels: entries.map((e) => e[0]), values: entries.map((e) => e[1]) };
};

export const aggregateField = (field: DesignerField, responses: ResponseLike[]): Aggregation => {
    const vals = cellValues(field, responses);
    const comp = field.componentType || "";

    if (comp === "DynamicSelect" || comp === "DynamicRadioGroup") {
        const counts: Record<string, number> = {};
        vals.forEach((v) => { const s = String(v); counts[s] = (counts[s] || 0) + 1; });
        return { type: "distribution", ...sortedDistribution(counts), answered: vals.length };
    }

    if (comp === "DynamicCheckbox" || comp === "DynamicCheckboxGroup" || comp === "DynamicMultiSelect") {
        const counts: Record<string, number> = {};
        vals.forEach((v) => {
            const parts = typeof v === "string" ? v.split(",").filter(Boolean) : Array.isArray(v) ? v : [String(v)];
            parts.forEach((p: string) => { const k = String(p).trim(); if (k) counts[k] = (counts[k] || 0) + 1; });
        });
        return { type: "distribution", ...sortedDistribution(counts), answered: vals.length };
    }

    if (comp === "DynamicDateField" || field.type === "date") {
        const byMonth: Record<string, number> = {};
        vals.forEach((v) => {
            const d = new Date(String(v));
            if (!isNaN(d.getTime())) {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                byMonth[key] = (byMonth[key] || 0) + 1;
            }
        });
        const labels = Object.keys(byMonth).sort();
        return { type: "timeline", labels, values: labels.map((l) => byMonth[l]), answered: vals.length };
    }

    if (field.type === "number" || comp === "DynamicNumberField") {
        const nums = vals.map(Number).filter((n) => !isNaN(n));
        if (nums.length === 0) return { type: "empty", answered: 0 };
        const sorted = [...nums].sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        return {
            type: "numeric",
            count: nums.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: Math.round((sum / nums.length) * 100) / 100,
            median: sorted[Math.floor(sorted.length / 2)],
            sum: Math.round(sum * 100) / 100,
        };
    }

    // Free text: distribution of identical answers + samples
    const counts: Record<string, number> = {};
    vals.forEach((v) => { const s = String(v).slice(0, 60); counts[s] = (counts[s] || 0) + 1; });
    const hasRepeats = Object.values(counts).some((c) => c > 1);
    if (hasRepeats) {
        return { type: "distribution", ...sortedDistribution(counts), answered: vals.length };
    }
    return { type: "text", answered: vals.length, samples: vals.slice(0, 12).map((v) => String(v).slice(0, 120)) };
};

/** Resolve a KPI metric to a display string. */
export const computeKpi = (
    widget: DashWidget,
    field: DesignerField | undefined,
    responses: ResponseLike[],
): { value: string; sub?: string } => {
    const metric: KpiMetric = widget.metric || "responses";
    if (metric === "responses" || !field) {
        return { value: String(responses.length), sub: "respuestas" };
    }
    const agg = aggregateField(field, responses);
    if (metric === "answered") {
        const answered = "answered" in agg ? agg.answered : 0;
        return { value: String(answered), sub: `de ${responses.length}` };
    }
    if (agg.type === "numeric") {
        const fmt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
        switch (metric) {
            case "sum": return { value: fmt(agg.sum), sub: "suma" };
            case "avg": return { value: fmt(agg.avg), sub: "promedio" };
            case "min": return { value: fmt(agg.min), sub: "mínimo" };
            case "max": return { value: fmt(agg.max), sub: "máximo" };
        }
    }
    return { value: "—", sub: "sin datos numéricos" };
};

/** Trim a distribution/timeline to a max number of categories. */
export const limitSeries = (labels: string[], values: number[], limit?: number) => {
    if (!limit || labels.length <= limit) return { labels, values };
    return { labels: labels.slice(0, limit), values: values.slice(0, limit) };
};
