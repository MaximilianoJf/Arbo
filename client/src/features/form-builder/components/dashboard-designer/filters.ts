// ─── Global dashboard filters ───
// Applied to the response set before any widget aggregates it.

import type { ResponseLike } from "./aggregations";

export interface DashboardFilters {
    from?: string;        // ISO date (inclusive, start of day)
    to?: string;          // ISO date (inclusive, end of day)
    fieldName?: string;   // filter by a field's answer
    value?: string;       // exact value the field must contain
}

export const EMPTY_FILTERS: DashboardFilters = {};

export const hasActiveFilters = (f: DashboardFilters) =>
    !!(f.from || f.to || (f.fieldName && f.value));

export const applyFilters = (responses: ResponseLike[], f: DashboardFilters): ResponseLike[] => {
    if (!hasActiveFilters(f)) return responses;

    const fromTs = f.from ? new Date(f.from + "T00:00:00").getTime() : null;
    const toTs = f.to ? new Date(f.to + "T23:59:59").getTime() : null;

    return responses.filter((r) => {
        // Date range on createdAt
        if (fromTs !== null || toTs !== null) {
            const t = r.createdAt ? new Date(r.createdAt).getTime() : NaN;
            if (isNaN(t)) return false;
            if (fromTs !== null && t < fromTs) return false;
            if (toTs !== null && t > toTs) return false;
        }
        // Field value match (substring, case-insensitive — handles multi-value CSV)
        if (f.fieldName && f.value) {
            const raw = r.answers?.[f.fieldName];
            const hay = Array.isArray(raw) ? raw.join(",") : String(raw ?? "");
            if (!hay.toLowerCase().includes(f.value.toLowerCase())) return false;
        }
        return true;
    });
};

/** Distinct answer values for a field, for building a filter dropdown. */
export const distinctValues = (responses: ResponseLike[], fieldName: string): string[] => {
    const set = new Set<string>();
    for (const r of responses) {
        const raw = r.answers?.[fieldName];
        if (raw === null || raw === undefined || raw === "") continue;
        const parts = Array.isArray(raw) ? raw.map(String) : typeof raw === "string" && raw.includes(",") ? raw.split(",") : [String(raw)];
        parts.forEach((p) => { const v = p.trim(); if (v) set.add(v); });
    }
    return Array.from(set).sort().slice(0, 50);
};
