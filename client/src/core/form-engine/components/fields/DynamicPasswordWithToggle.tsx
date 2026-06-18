import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Button, InputGroup, Label, TextField, FieldError } from "@heroui/react";
import { useState } from "react";
import type { FormField } from "../../types";

interface DynamicPasswordWithToggleProps extends FormField {
    className?: string;
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    formState: Record<string, { value: string | number; error: string | null }>;
}

export const DynamicPasswordWithToggle = ({ name, label, formState, placeholder, required, minLength, maxLength, className, handleInputChange }: DynamicPasswordWithToggleProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;

    return (
        <TextField className={`w-full ${className}`} isInvalid={isInvalid}>
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
                    value={state.value}
                    onChange={handleInputChange}
                />
                <InputGroup.Suffix className="pr-0 bg-transparent">
                    <Button
                        isIconOnly
                        aria-label={isVisible ? "Hide password" : "Show password"}
                        size="sm"
                        variant="ghost"
                        className="bg-transparent"
                        onPress={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
                    </Button>
                </InputGroup.Suffix>
            </InputGroup>
            {isInvalid && <FieldError>{error}</FieldError>}
        </TextField>
    );
};
