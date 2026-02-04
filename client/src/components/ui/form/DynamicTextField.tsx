
import { InputGroup, Label, TextField as TextFieldHero, FieldError } from "@heroui/react";
import type { FormField, AllValues } from "../../../interfaces";
// import { Envelope } from "@gravity-ui/icons";

interface DynamicTextFieldProps extends FormField {
    icon?: React.ReactNode;
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string; error: string | null }>;
    allValues?: AllValues;

}

export const DynamicTextField = ({ name, label, placeholder, formState, required, minLength, maxLenght, className, handleInputChange }: DynamicTextFieldProps) => {

    const error = formState[name].error;
    const isInvalid = !!error;

    return (
        <TextFieldHero className={`w-full ${className}`} isInvalid={isInvalid}>
            <Label>{label}</Label>
            <InputGroup>
                {/* 
                <InputGroup.Prefix>
                    <Envelope className="size-4 text-muted" />
                </InputGroup.Prefix> */}
                <InputGroup.Input
                    value={formState[name].value}
                    name={name}
                    onChange={handleInputChange}
                    required={required}
                    minLength={minLength}
                    maxLength={maxLenght}
                    placeholder={placeholder}

                />
            </InputGroup>
            {isInvalid && <FieldError>{error}</FieldError>}
        </TextFieldHero>
    );
}
