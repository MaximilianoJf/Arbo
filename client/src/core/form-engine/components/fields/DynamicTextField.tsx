import { InputGroup, Label, TextField as TextFieldHero, FieldError } from "@heroui/react";
import type { FormField } from "../../types";

interface DynamicTextFieldProps extends FormField {
    icon?: React.ReactNode;
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
}

export const DynamicTextField = ({ name, label, type, placeholder, formState, required, minLength, maxLength, className, handleInputChange }: DynamicTextFieldProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;

    return (
        <TextFieldHero className={`w-full ${className}`} isInvalid={isInvalid}>
            <Label>{label}</Label>
            <InputGroup>
                <InputGroup.Input
                    value={state.value}
                    name={name}
                    onChange={handleInputChange}
                    required={required}
                    minLength={minLength}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    type={type}
                />
            </InputGroup>
            {isInvalid && <FieldError>{error}</FieldError>}
        </TextFieldHero>
    );
};
