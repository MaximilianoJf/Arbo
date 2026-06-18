import { FieldError } from "@heroui/react";
import type { FieldOptionsSource, FormField } from "../../types";
import { useRemoteOptions } from "../../hooks/useRemoteOptions";

interface DynamicCheckboxProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
    options?: string[];
    optionsSource?: FieldOptionsSource;
}

export const DynamicCheckbox = ({ name, label, formState, required, className, handleInputChange, options = [], optionsSource }: DynamicCheckboxProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;

    const selectedValues: string[] = typeof state.value === "string" && state.value
        ? state.value.split(",").filter(Boolean)
        : [];

    const { items: remoteItems, loading } = useRemoteOptions(optionsSource);
    const items = remoteItems ?? options.map((o) => ({ value: o, label: o }));

    const commit = (values: string[]) => {
        handleInputChange?.({ target: { name, value: values.join(",") } } as React.ChangeEvent<HTMLInputElement>);
    };

    // Single boolean checkbox (no options defined and no remote source)
    if (!optionsSource && options.length === 0) {
        const isChecked = state.value === "true" || state.value === "1";
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <label className="inline-flex items-center gap-3 cursor-pointer select-none w-full group">
                    <span
                        className="flex items-center justify-center size-5 rounded border-2 transition-colors shrink-0"
                        style={{
                            borderColor: isChecked ? "var(--arbo-accent)" : "var(--field-input-border, var(--arbo-border-light))",
                            background: isChecked ? "var(--arbo-accent)" : "transparent",
                        }}
                    >
                        {isChecked && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </span>
                    <input
                        type="checkbox"
                        name={name}
                        checked={isChecked}
                        required={required}
                        className="sr-only"
                        onChange={(e) => {
                            handleInputChange?.({ target: { name, value: String(e.target.checked) } } as React.ChangeEvent<HTMLInputElement>);
                        }}
                    />
                    <span className="text-sm arbo-field-label">{label}</span>
                </label>
                <input type="hidden" name={name} value={isChecked ? "true" : "false"} />
                {isInvalid && <FieldError>{error}</FieldError>}
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <span className="text-sm font-medium arbo-field-label">{label}</span>
            {loading ? (
                <p className="text-xs arbo-text-muted italic">Cargando opciones…</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {items.map((item) => {
                        const isSelected = selectedValues.includes(item.value);
                        return (
                            <label key={item.value} className="inline-flex items-center gap-3 cursor-pointer select-none group">
                                <span
                                    className="flex items-center justify-center size-5 rounded border-2 transition-colors shrink-0"
                                    style={{
                                        borderColor: isSelected ? "var(--arbo-accent)" : "var(--field-input-border, var(--arbo-border-light))",
                                        background: isSelected ? "var(--arbo-accent)" : "transparent",
                                    }}
                                >
                                    {isSelected && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </span>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isSelected}
                                    onChange={() => {
                                        const next = isSelected
                                            ? selectedValues.filter((v) => v !== item.value)
                                            : [...selectedValues, item.value];
                                        commit(next);
                                    }}
                                />
                                <span className="text-sm arbo-option-text">{item.label}</span>
                            </label>
                        );
                    })}
                </div>
            )}
            <input type="hidden" name={name} value={selectedValues.join(",")} />
            {isInvalid && <FieldError>{error}</FieldError>}
        </div>
    );
};
