import type { ComponentType, FieldCondition, FieldStyles, FormField } from "../types";
import { VALIDATION_RULES } from "./formValidations";

const VALID_OPERATORS = ["equals", "notEquals", "contains", "notEmpty", "empty"];

/** Keeps only well-formed conditions. */
const normalizeConditions = (raw: any): FieldCondition[] | undefined => {
    if (!Array.isArray(raw)) return undefined;
    const out = raw.filter((c) =>
        c && typeof c.field === "string" && VALID_OPERATORS.includes(c.operator)
    ).map((c) => ({ field: c.field, operator: c.operator, ...(c.value !== undefined ? { value: String(c.value) } : {}) }));
    return out.length ? out : undefined;
};

/** Color-key synonyms the AI may emit → canonical FieldStyles keys. */
const STYLE_KEY_MAP: Record<string, keyof FieldStyles> = {
    labelColor: "labelColor",
    inputBgColor: "inputBgColor",
    inputTextColor: "inputTextColor",
    inputBorderColor: "inputBorderColor",
    labelColorHover: "labelColorHover",
    inputBgColorHover: "inputBgColorHover",
    inputTextColorHover: "inputTextColorHover",
    inputBorderColorHover: "inputBorderColorHover",
    // synonyms
    bgColor: "inputBgColor",
    backgroundColor: "inputBgColor",
    background: "inputBgColor",
    textColor: "inputTextColor",
    color: "inputTextColor",
    borderColor: "inputBorderColor",
    bgColorHover: "inputBgColorHover",
    textColorHover: "inputTextColorHover",
    borderColorHover: "inputBorderColorHover",
    hoverBgColor: "inputBgColorHover",
    hoverTextColor: "inputTextColorHover",
    hoverBorderColor: "inputBorderColorHover",
};

/** Normalizes whatever style object the AI produced into FieldStyles. */
const normalizeFieldStyles = (raw: any): FieldStyles | undefined => {
    if (!raw || typeof raw !== "object") return undefined;
    const out: FieldStyles = {};
    for (const [k, v] of Object.entries(raw)) {
        const key = STYLE_KEY_MAP[k];
        if (key && typeof v === "string" && v) out[key] = v;
    }
    return Object.keys(out).length ? out : undefined;
};

/** Keeps known validation keys; unknown ones are dropped (regex covers the rest). */
const normalizeValidations = (raw: any, required?: boolean): string[] => {
    const keys = Array.isArray(raw) ? raw.filter((k) => typeof k === "string" && VALIDATION_RULES[k]) : [];
    if (required && !keys.includes("required")) keys.push("required");
    return keys;
};

/**
 * Maps an AI `update_schema` fields payload into clean FormFields.
 * Tolerant by design: synonym colors, unknown validations, missing names.
 */
export const mapAIFields = (fields: any[]): FormField[] =>
    fields.map((f: any, i: number) => {
        const name = f.name || `field_${Date.now()}_${i}`;
        return {
            id: crypto.randomUUID(),
            name,
            label: f.label ?? name,
            placeholder: f.placeholder ?? "",
            type: f.type ?? "text",
            componentType: (f.componentType || "DynamicTextField") as ComponentType,
            value: f.value ?? f.defaultValue ?? "",
            required: f.required ?? false,
            validate: normalizeValidations(f.validations ?? f.validate, f.required),
            options: Array.isArray(f.options) ? f.options : [],
            sortOrder: f.sortOrder ?? i,
            page: f.page ?? 0,
            rows: typeof f.rows === "number" ? f.rows : undefined,
            accept: Array.isArray(f.accept) ? f.accept : undefined,
            pattern: typeof (f.pattern ?? f.regex) === "string" ? (f.pattern ?? f.regex) : undefined,
            patternMessage: typeof f.patternMessage === "string" ? f.patternMessage : undefined,
            fieldStyles: normalizeFieldStyles(f.fieldStyles ?? f.styles),
            visibleWhen: normalizeConditions(f.visibleWhen ?? f.conditions ?? f.showWhen),
            hiddenWhen: normalizeConditions(f.hiddenWhen ?? f.hideWhen),
            logicMode: f.logicMode === "any" ? "any" : undefined,
        };
    });
