import { FieldError } from "@heroui/react";
import type { FieldOptionsSource, FormField } from "../../types";
import { useRemoteOptions } from "../../hooks/useRemoteOptions";

interface DynamicRadioGroupProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
    options?: string[];
    optionsSource?: FieldOptionsSource;
}

export const DynamicRadioGroup = ({ name, label, formState, required, className, handleInputChange, options = [], optionsSource }: DynamicRadioGroupProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;
    const currentValue = String(state.value);

    const { items: remoteItems, loading } = useRemoteOptions(optionsSource);
    const items = remoteItems ?? options.map((o) => ({ value: o, label: o }));

    const handleSelect = (val: string) => {
        handleInputChange?.({ target: { name, value: val } } as React.ChangeEvent<HTMLInputElement>);
    };

    if (!loading && items.length === 0) {
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <span className="text-sm font-medium arbo-field-label">{label}</span>
                <p className="text-xs arbo-text-muted italic">No hay opciones definidas para este campo.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <span className="text-sm font-medium arbo-field-label">
                {label}
                {required && <span className="text-[var(--arbo-danger)] ml-0.5">*</span>}
            </span>
            {loading ? (
                <p className="text-xs arbo-text-muted italic">Cargando opciones…</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {items.map((item) => {
                        const isSelected = currentValue === item.value;
                        return (
                            <label key={item.value} className="inline-flex items-center gap-3 cursor-pointer select-none group">
                                <span
                                    className="flex items-center justify-center size-5 rounded-full border-2 transition-colors shrink-0"
                                    style={{ borderColor: isSelected ? "var(--arbo-accent)" : "var(--field-input-border, var(--arbo-border-light))" }}
                                >
                                    {isSelected && <span className="size-2.5 rounded-full" style={{ background: "var(--arbo-accent)" }} />}
                                </span>
                                <input
                                    type="radio"
                                    name={name}
                                    value={item.value}
                                    className="sr-only"
                                    checked={isSelected}
                                    required={required && !currentValue}
                                    onChange={() => handleSelect(item.value)}
                                />
                                <span className="text-sm arbo-option-text">{item.label}</span>
                            </label>
                        );
                    })}
                </div>
            )}
            <input type="hidden" name={name} value={currentValue} />
            {isInvalid && <FieldError>{error}</FieldError>}
        </div>
    );
};
