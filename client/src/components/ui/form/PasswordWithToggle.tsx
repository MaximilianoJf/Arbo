import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Button, InputGroup, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { FieldError } from "@heroui/react";

interface PasswordWithToggleProps {
    name: string;
    label: string;
    placeholder?: string;
    value: string;
    error?: string | null;
    validate?: (value: string) => string | null;
    required?: boolean
    minLength?: number;
    maxLenght?: number;
    className?: string;
}

export function PasswordWithToggle({ name, label, placeholder, value, validate, required, minLength, maxLenght, className }: PasswordWithToggleProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [passwordValue, setPasswordValue] = useState(value);
    const [error, setError] = useState<string | null>(null);
    const [isInvalid, setIsInvalid] = useState(false);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        setPasswordValue(e.target.value);
        setError(validate(e.target.value))
        setIsInvalid(validate(e.target.value) !== null);
        //Debo externalizar los los datos del config, ver gemini
        console.log(isInvalid)
    }


    return (
        <TextField className={`w-full ${className}`}
            name="password"
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
                    value={passwordValue}
                    onChange={onChange}
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