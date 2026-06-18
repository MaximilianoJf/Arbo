import type { FieldCondition, FormField } from "../types";

/** Evaluates a single condition against the current form values. */
export const evalCondition = (cond: FieldCondition, values: Record<string, any>): boolean => {
    const raw = values[cond.field];
    const v = raw === undefined || raw === null ? "" : String(raw);
    switch (cond.operator) {
        case "equals": return v === String(cond.value ?? "");
        case "notEquals": return v !== String(cond.value ?? "");
        // multi-value fields (checkbox/multiselect) join with commas — contains covers them
        case "contains": return v.split(",").map((s) => s.trim()).includes(String(cond.value ?? "")) || v.includes(String(cond.value ?? ""));
        case "notEmpty": return v.trim() !== "";
        case "empty": return v.trim() === "";
        default: return true;
    }
};

/** Combines conditions according to the field's logicMode: "all" = Y, "any" = O. */
const matches = (conds: FieldCondition[], values: Record<string, any>, mode: "all" | "any"): boolean =>
    mode === "any" ? conds.some((c) => evalCondition(c, values)) : conds.every((c) => evalCondition(c, values));

/** Visible = visibleWhen matches (if any) AND NOT hiddenWhen matches. */
export const isFieldVisible = (field: FormField, values: Record<string, any>): boolean => {
    const mode = field.logicMode === "any" ? "any" : "all";
    if (field.visibleWhen?.length && !matches(field.visibleWhen, values, mode)) return false;
    if (field.hiddenWhen?.length && matches(field.hiddenWhen, values, mode)) return false;
    return true;
};

/** Filters a field list down to the currently visible ones. */
export const getVisibleFields = (fields: FormField[], values: Record<string, any>): FormField[] =>
    fields.filter((f) => isFieldVisible(f, values));

/** Conditions that point to missing fields are dangling (e.g. after deleting the source). */
export const pruneDanglingConditions = (fields: FormField[]): FormField[] => {
    const names = new Set(fields.map((f) => f.name));
    return fields.map((f) =>
        f.visibleWhen?.some((c) => !names.has(c.field))
            ? { ...f, visibleWhen: f.visibleWhen.filter((c) => names.has(c.field)) }
            : f
    );
};
