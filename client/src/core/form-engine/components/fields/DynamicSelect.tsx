import { Label, ListBox, Select, FieldError } from "@heroui/react";
import type { FormField } from "../../types";

interface DynamicSelectProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
    options?: string[];
}

export const DynamicSelect = ({ name, label, placeholder, formState, required, className, handleInputChange, options = [] }: DynamicSelectProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;
    const currentValue = String(state.value);

    if (options.length === 0) {
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted italic">No options defined for this select field.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <Select
                name={name}
                className="w-full"
                placeholder={placeholder || "Select an option"}
                isRequired={required}
                isInvalid={isInvalid}
                selectedKey={currentValue || null}
                onSelectionChange={(key) => {
                    const syntheticEvent = {
                        target: { name, value: String(key) },
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleInputChange?.(syntheticEvent);
                }}
            >
                <Label>{label}</Label>
                <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="border border-default">
                    <ListBox>
                        {options.map((opt) => (
                            <ListBox.Item key={opt} id={opt} textValue={opt}>
                                {opt}
                                <ListBox.ItemIndicator />
                            </ListBox.Item>
                        ))}
                    </ListBox>
                </Select.Popover>
            </Select>
            {isInvalid && <FieldError>{error}</FieldError>}
        </div>
    );
};
