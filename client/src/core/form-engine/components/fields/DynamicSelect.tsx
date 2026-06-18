import { Label, ListBox, Select, FieldError } from "@heroui/react";
import type { FieldOptionsSource, FormField } from "../../types";
import { useRemoteOptions } from "../../hooks/useRemoteOptions";

interface DynamicSelectProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
    options?: string[];
    optionsSource?: FieldOptionsSource;
}

export const DynamicSelect = ({ name, label, placeholder, formState, required, className, handleInputChange, options = [], optionsSource }: DynamicSelectProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;
    const isInvalid = !!error;
    const currentValue = String(state.value);

    const { items: remoteItems, loading } = useRemoteOptions(optionsSource);
    const items = remoteItems ?? options.map((o) => ({ value: o, label: o }));

    // Show empty state only when we are certain there are no options:
    // - no optionsSource → field was left without static options (truly unconfigured)
    // - optionsSource set AND fetch completed (remoteItems !== null) but returned 0 results
    // When remoteItems is still null the fetch is in-flight; don't show the message yet.
    if (!loading && items.length === 0 && (remoteItems !== null || !optionsSource)) {
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted italic">No hay opciones definidas para este campo.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <Select
                name={name}
                className="w-full"
                placeholder={loading ? "Cargando..." : (placeholder || "Seleccioná una opción")}
                isRequired={required}
                isInvalid={isInvalid}
                isDisabled={loading}
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
                        {items.map((item) => (
                            <ListBox.Item key={item.value} id={item.value} textValue={item.label}>
                                {item.label}
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
