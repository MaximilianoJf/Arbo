import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Button, InputGroup, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { FieldError } from "@heroui/react";
import type { FormField } from "../../../interfaces";

interface PasswordWithToggleProps extends FormField {
    className?: string;
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    formState: Record<string, { value: string; error: string | null }>;
    allValues?: Record<string, string | number>;
}

export function PasswordWithToggle({ name, label, formState, placeholder, value, validate, required, minLength, maxLenght, className, handleInputChange }: PasswordWithToggleProps) {
    const [isVisible, setIsVisible] = useState(false);
    const allValues = Object.entries(formState).reduce((acc, [key, field]) => {
        acc[key] = field.value;
        return acc;
    }, {} as Record<string, string | number>);

    const error = (validate && formState[name].value !== '') ? validate(formState[name].value, allValues) : null;
    const isInvalid = !!error;


    return (
        <TextField className={`w-full ${className}`}
            isInvalid={isInvalid}
        >
            <Label>{label}</Label>
            <InputGroup>
                <InputGroup.Input
                    name={name}
                    placeholder={placeholder}
                    required={required}
                    minLength={minLength}
                    maxLength={maxLenght}
                    className="w-full"
                    type={isVisible ? "text" : "password"}
                    value={value}
                    onChange={handleInputChange}
                />
                <InputGroup.Suffix className="pr-0">
                    <Button
                        isIconOnly
                        aria-label={isVisible ? "Hide password" : "Show password"}
                        size="sm"
                        variant="ghost"
                        onPress={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
                    </Button>
                </InputGroup.Suffix>
            </InputGroup>
            {isInvalid && <FieldError>{error}</FieldError>}
        </TextField>
    );
}