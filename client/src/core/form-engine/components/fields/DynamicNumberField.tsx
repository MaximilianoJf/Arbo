import { InputGroup, Label, TextField, FieldError } from "@heroui/react";
import type { FormField } from "../../types";

interface DynamicNumberFieldProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string; error: string | null }>;
}

export const DynamicNumberField = ({ name, label, placeholder, formState, required, className, handleInputChange }: DynamicNumberFieldProps) => {
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
                    type="number"
                />
            </InputGroup>
            {isInvalid && <FieldError>{error}</FieldError>}
        </TextField>
    );
};
