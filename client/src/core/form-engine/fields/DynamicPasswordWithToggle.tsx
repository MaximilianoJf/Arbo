import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Button, InputGroup, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { FieldError } from "@heroui/react";
import type { FormField, AllValues } from "../types";

interface DynamicPasswordWithToggleProps extends FormField {
    className?: string;
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    formState: Record<string, { value: string; error: string | null }>;
    allValues?: AllValues;
}

export const DynamicPasswordWithToggle = ({ name, label, formState, placeholder, required, minLength, maxLength, className, handleInputChange }: DynamicPasswordWithToggleProps) => {
    const [isVisible, setIsVisible] = useState(false);

    const error = formState[name].error;
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
                    maxLength={maxLength}
                    className="w-full"
                    type={isVisible ? "text" : "password"}
                    value={formState[name].value}
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

