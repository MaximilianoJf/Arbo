import { useEffect, useRef, useState } from "react";
import { ChevronDown, Xmark } from "@gravity-ui/icons";
import { FieldError } from "@heroui/react";
import type { FieldOptionsSource, FormField } from "../../types";
import { useRemoteOptions } from "../../hooks/useRemoteOptions";

interface DynamicMultiSelectProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
    options?: string[];
    optionsSource?: FieldOptionsSource;
}

export const DynamicMultiSelect = ({ name, label, placeholder, formState, required, className, handleInputChange, options = [], optionsSource }: DynamicMultiSelectProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    const selected: string[] = typeof state.value === "string" && state.value
        ? state.value.split(",").filter(Boolean)
        : [];

    const { items: remoteItems, loading } = useRemoteOptions(optionsSource);
    const items = remoteItems ?? options.map((o) => ({ value: o, label: o }));

    const commit = (values: string[]) => {
        handleInputChange?.({ target: { name, value: values.join(",") } } as React.ChangeEvent<HTMLInputElement>);
    };

    const toggle = (val: string) =>
        commit(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

    const labelOf = (val: string) => items.find((i) => i.value === val)?.label ?? val;

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    if (!loading && items.length === 0) {
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <span className="text-sm font-medium arbo-field-label">{label}</span>
                <p className="text-xs italic" style={{ color: "var(--arbo-text-muted)" }}>No hay opciones definidas para este campo.</p>
            </div>
        );
    }

    return (
        <div ref={wrapRef} className={`relative flex flex-col gap-1 ${className}`}>
            <span data-slot="label" className="text-sm font-medium arbo-field-label">{label}</span>

            <button
                type="button"
                data-slot="trigger"
                onClick={() => setOpen((v) => !v)}
                disabled={loading}
                className="flex items-center gap-1.5 w-full min-h-10 px-3 py-1.5 rounded-lg border text-left text-sm transition-colors flex-wrap"
                style={{
                    background: "transparent",
                    borderColor: open ? "var(--arbo-accent)" : "var(--field-input-border, var(--arbo-border-light))",
                    color: selected.length ? "var(--field-input-text, var(--arbo-text))" : "var(--arbo-text-muted)",
                }}
            >
                {loading && "Cargando…"}
                {!loading && selected.length === 0 && (placeholder || "Seleccioná una o más opciones")}
                {!loading && selected.map((val) => (
                    <span
                        key={val}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-xs"
                        style={{ background: "var(--arbo-accent-muted)", color: "var(--arbo-accent)" }}
                        onClick={(e) => { e.stopPropagation(); toggle(val); }}
                    >
                        {labelOf(val)}
                        <Xmark className="size-3 opacity-70 hover:opacity-100" />
                    </span>
                ))}
                <ChevronDown
                    className={`size-4 ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    style={{ color: "var(--arbo-text-muted)" }}
                />
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 right-0 mt-1 z-30 rounded-lg border shadow-lg overflow-auto max-h-56 py-1"
                    style={{ background: "var(--arbo-surface-2)", borderColor: "var(--arbo-border)" }}
                >
                    {items.map((item) => {
                        const isSelected = selected.includes(item.value);
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => toggle(item.value)}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--arbo-surface-3)]"
                                style={{ color: "var(--arbo-text)" }}
                            >
                                <span
                                    className="flex items-center justify-center rounded border-2 transition-colors shrink-0"
                                    style={{
                                        width: 18, height: 18,
                                        borderColor: isSelected ? "var(--arbo-accent)" : "var(--arbo-border-light)",
                                        background: isSelected ? "var(--arbo-accent)" : "transparent",
                                    }}
                                >
                                    {isSelected && (
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </span>
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <input type="text" name={name} value={selected.join(",")} required={required} readOnly
                tabIndex={-1} aria-hidden className="sr-only absolute bottom-0 left-3 w-px h-px opacity-0 pointer-events-none" />
            {isInvalid && <FieldError>{error}</FieldError>}
        </div>
    );
};
