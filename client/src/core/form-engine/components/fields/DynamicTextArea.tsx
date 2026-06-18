import { Label, TextField, FieldError } from "@heroui/react";
import type { FormField } from "../../types";

interface DynamicTextAreaProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    className?: string;
    formState: Record<string, { value: string; error: string | null }>;
}

export const DynamicTextArea = ({ name, label, placeholder, formState, required, minLength, maxLength, className, handleInputChange, rows }: DynamicTextAreaProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;

    return (
        <TextField className={`w-full ${className}`} isInvalid={isInvalid}>
            <Label>{label}</Label>
            <textarea
                name={name}
                value={state.value}
                onChange={handleInputChange as any}
                required={required}
                minLength={minLength}
                maxLength={maxLength}
                placeholder={placeholder}
                rows={rows ?? 4}
                className="w-full rounded-lg border border-default bg-transparent px-3 py-2 text-sm outline-none focus:border-primary resize-y"
            />
            {isInvalid && <FieldError>{error}</FieldError>}
        </TextField>
    );
};
