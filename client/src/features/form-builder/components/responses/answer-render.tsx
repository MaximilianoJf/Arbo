// Shared rendering for a single response's answers — used by the flat responses
// list and by the nested chain view. Keeps one source of truth for how a field
// value is displayed (checkbox, radio, select, textarea, plain).

export interface RespField {
    name: string;
    label: string;
    type: string;
    componentType: string;
    options?: { label: string; value: string }[] | string[];
    placeholder?: string;
}

export interface ChainResponse {
    id: number;
    formId?: number;
    answers: Record<string, any>;
    respondentName: string | null;
    respondentEmail: string | null;
    respondentId: number | null;
    parentResponseId?: number | null;
    parentFormId?: number | null;
    rootResponseId?: number | null;
    createdAt: string;
    children?: ChainResponse[];
}

// Normalise options to { label, value } regardless of format
export const normaliseOptions = (opts?: RespField["options"]) => {
    if (!opts) return [];
    return opts.map((o: any) =>
        typeof o === "string" ? { label: o, value: o } : { label: o.label ?? o.value, value: o.value }
    );
};

export const formatAnswer = (value: any, t?: (key: string) => string): string => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "boolean") return value ? (t?.("common.yes") ?? "Sí") : (t?.("common.no") ?? "No");
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "string" && value.includes(",")) return value.split(",").filter(Boolean).join(", ");
    return String(value);
};

/** Orders a response's answers by the form's field order, then any extra keys. */
export const getOrderedAnswers = (answers: Record<string, any>, fields: RespField[]) => {
    const fieldMap: Record<string, RespField> = {};
    fields.forEach((f) => { fieldMap[f.name] = f; });
    const ordered = fields.filter((f) => !f.name.startsWith("__page_break_")).map((f) => f.name);

    const entries: { key: string; field: RespField | undefined; value: any }[] = [];
    for (const name of ordered) entries.push({ key: name, field: fieldMap[name], value: answers[name] });
    for (const key of Object.keys(answers)) {
        if (!fieldMap[key] && !key.startsWith("__")) entries.push({ key, field: undefined, value: answers[key] });
    }
    return entries;
};

// ── Renders a single field with the answer filled in ──────────────────────────
export const FieldAnswer = ({ field, value, t }: { field: RespField; value: any; t: (key: string) => string }) => {
    const opts = normaliseOptions(field.options);
    const isEmpty = value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    const displayValue = formatAnswer(value, t);

    const inputBase =
        "w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-sm arbo-text";

    const labelEl = (
        <label className="text-xs font-medium arbo-text-secondary block mb-1.5">
            {field.label || field.name}
        </label>
    );

    // ── Checkbox / Checkbox group ──
    if (field.componentType === "DynamicCheckbox" || field.componentType === "DynamicCheckboxGroup") {
        const selected: string[] = Array.isArray(value)
            ? value.map(String)
            : typeof value === "string" && value
                ? value.split(",").filter(Boolean)
                : [];
        if (opts.length > 0) {
            return (
                <div>
                    {labelEl}
                    <div className="flex flex-col gap-2">
                        {opts.map((opt) => {
                            const checked = selected.includes(opt.value);
                            return (
                                <label key={opt.value} className="flex items-center gap-2.5 cursor-default select-none">
                                    <div className={`size-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                        checked
                                            ? "bg-[var(--arbo-accent)] border-[var(--arbo-accent)]"
                                            : "bg-[var(--arbo-surface-2)] border-[var(--arbo-border)]"
                                    }`}>
                                        {checked && (
                                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                <path d="M1 3.5L3.5 6L8 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`text-sm ${checked ? "arbo-text font-medium" : "arbo-text-muted"}`}>{opt.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            );
        }
    }

    // ── Radio group ──
    if (field.componentType === "DynamicRadioGroup") {
        const selected = value ? String(value) : "";
        if (opts.length > 0) {
            return (
                <div>
                    {labelEl}
                    <div className="flex flex-col gap-2">
                        {opts.map((opt) => {
                            const checked = selected === opt.value;
                            return (
                                <label key={opt.value} className="flex items-center gap-2.5 cursor-default select-none">
                                    <div className={`size-4 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                                        checked
                                            ? "border-[var(--arbo-accent)]"
                                            : "bg-[var(--arbo-surface-2)] border-[var(--arbo-border)]"
                                    }`}>
                                        {checked && <div className="size-2 rounded-full bg-[var(--arbo-accent)]" />}
                                    </div>
                                    <span className={`text-sm ${checked ? "arbo-text font-medium" : "arbo-text-muted"}`}>{opt.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            );
        }
    }

    // ── Select ──
    if (field.componentType === "DynamicSelect") {
        const selected = opts.find((o) => o.value === String(value ?? ""));
        return (
            <div>
                {labelEl}
                <div className={`${inputBase} flex items-center justify-between ${isEmpty ? "arbo-text-muted" : ""}`}>
                    <span>{selected?.label || displayValue || <span className="italic arbo-text-muted">{t("common.noResponse")}</span>}</span>
                    <svg className="size-3.5 arbo-text-muted shrink-0" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                </div>
            </div>
        );
    }

    // ── Textarea ──
    if (field.componentType === "DynamicTextarea" || field.type === "textarea") {
        return (
            <div>
                {labelEl}
                <div className={`${inputBase} min-h-[80px] leading-relaxed whitespace-pre-wrap ${isEmpty ? "italic arbo-text-muted" : ""}`}>
                    {displayValue || t("common.noResponse")}
                </div>
            </div>
        );
    }

    // ── Default: text / number / email / etc ──
    return (
        <div>
            {labelEl}
            <div className={`${inputBase} ${isEmpty ? "italic arbo-text-muted" : ""}`}>
                {displayValue || t("common.noResponse")}
            </div>
        </div>
    );
};
