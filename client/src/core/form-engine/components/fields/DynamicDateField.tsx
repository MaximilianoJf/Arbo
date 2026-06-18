import { InputGroup, Label, TextField, FieldError } from "@heroui/react";
import type { FormField } from "../../types";

interface DynamicDateFieldProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string; error: string | null }>;
}

export const DynamicDateField = ({ name, label, type, placeholder, formState, required, className, handleInputChange }: DynamicDateFieldProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;
    // type "datetime" → date + time picker; anything else → date only
    const inputType = type === "datetime" ? "datetime-local" : "date";

    return (
        <TextField className={`w-full ${className}`} isInvalid={isInvalid}>
            <Label>{label}</Label>
            <InputGroup>
                <InputGroup.Input
                    name={name}
                    value={state.value}
                    onChange={handleInputChange}
                    required={required}
                    placeholder={placeholder}
                    type={inputType}
                />
            </InputGroup>
            {isInvalid && <FieldError>{error}</FieldError>}
        </TextField>
    );
};
