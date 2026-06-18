import { FieldError } from "@heroui/react";
import type { FormField } from "../../types";

interface DynamicRadioGroupProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
    options?: string[];
}

export const DynamicRadioGroup = ({ name, label, formState, required, className, handleInputChange, options = [] }: DynamicRadioGroupProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;
    const currentValue = String(state.value);

    const handleSelect = (opt: string) => {
        const syntheticEvent = {
            target: { name, value: opt },
        } as React.ChangeEvent<HTMLInputElement>;
        handleInputChange?.(syntheticEvent);
    };

    if (options.length === 0) {
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <span className="text-sm font-medium" style={{ color: "var(--arbo-text)" }}>{label}</span>
                <p className="text-xs arbo-text-muted italic">No hay opciones definidas para este campo.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <span className="text-sm font-medium" style={{ color: "var(--arbo-text)" }}>
                {label}
                {required && <span className="text-[var(--arbo-danger)] ml-0.5">*</span>}
            </span>
            <div className="flex flex-col gap-2">
                {options.map((opt) => {
                    const isSelected = currentValue === opt;
                    return (
                        <label key={opt} className="inline-flex items-center gap-3 cursor-pointer select-none group">
                            <span
                                className="flex items-center justify-center size-5 rounded-full border-2 transition-colors shrink-0"
                                style={{
                                    borderColor: isSelected ? "var(--arbo-accent)" : "var(--arbo-border-light)",
                                }}
                            >
                                {isSelected && (
                                    <span
                                        className="size-2.5 rounded-full"
                                        style={{ background: "var(--arbo-accent)" }}
                                    />
                                )}
                            </span>
                            <input
                                type="radio"
                                name={name}
                                value={opt}
                                className="sr-only"
                                checked={isSelected}
                                required={required && !currentValue}
                                onChange={() => handleSelect(opt)}
                            />
                            <span className="text-sm" style={{ color: "var(--arbo-text)" }}>{opt}</span>
                        </label>
                    );
                })}
            </div>
            <input type="hidden" name={name} value={currentValue} />
            {isInvalid && <FieldError>{error}</FieldError>}
        </div>
    );
};
