import type { FormField } from "../types";

// Extended field properties that aren't first-class columns on the server's
// FormField model — they round-trip through a single JSONB `meta` column.
const META_KEYS = [
    "span", "spanTablet", "spanMobile",
    "rows", "accept",
    "pattern", "patternMessage",
    "visibleWhen", "hiddenWhen", "logicMode",
    "groupId", "groupLabel",
    "optionsSource",
] as const;

/** Packs a schema field's extended props into the object stored in `meta` (omitting empty ones). */
export const buildFieldMeta = (field: Partial<FormField>): Record<string, any> | null => {
    const meta: Record<string, any> = {};
    for (const key of META_KEYS) {
        const val = (field as any)[key];
        if (val === undefined || val === null) continue;
        if (Array.isArray(val) && val.length === 0) continue;
        meta[key] = val;
    }
    return Object.keys(meta).length > 0 ? meta : null;
};

/** Spreads a persisted field's `meta` back onto the top level of the schema field. */
export const applyFieldMeta = (field: any): Record<string, any> => {
    const meta = field?.meta;
    return meta && typeof meta === "object" ? { ...meta } : {};
};
