import { InputGroup, Label, TextField, FieldError } from "@heroui/react";
import type { FormField } from "../../types";

interface DynamicDateFieldProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string; error: string | null }>;
}

export const DynamicDateField = ({ name, label, placeholder, formState, required, className, handleInputChange }: DynamicDateFieldProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;

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
                    type="date"
                />
            </InputGroup>
            {isInvalid && <FieldError>{error}</FieldError>}
        </TextField>
    );
};
