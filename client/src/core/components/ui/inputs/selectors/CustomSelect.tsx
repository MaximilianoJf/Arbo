
import {
    Label,
    ListBox,
    Select,
} from "@heroui/react";

interface SelectOption {
    label: string;
    value: string;
    icon?: React.ElementType;
}

interface CustomSelectProps {
    options: SelectOption[];
    value?: string;
    onChangeSelect?: any;
    name?: string;
    label?: string;
    placeholder?: string;
}

export const CustomSelect = ({ options, value, onChangeSelect, name, label, placeholder }: CustomSelectProps) => {
    return (
        <Select
            name={name}
            className="w-full"
            placeholder={placeholder}
            selectedKey={value}
            onSelectionChange={(key) => {
                onChangeSelect({
                    target: { name, value: String(key) }
                });
            }}
        >
            <Label>{label}</Label>
            <Select.Trigger >
                <Select.Value >
                    {({ defaultChildren, isPlaceholder, state }) => {
                        if (isPlaceholder || state.selectedItems.length === 0) return defaultChildren;

                        const selectedKey = state.selectedItems[0]?.key;
                        const item = options.find((opt) => opt.value === selectedKey);

                        if (!item) return defaultChildren;

                        return (
                            <div className="flex items-center gap-2 ">
                                {item.icon && <item.icon className="size-4" />}
                                <span>{item.label}</span>
                            </div>
                        );
                    }}
                </Select.Value>
                <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="border border-default">
                <ListBox>
                    {options.map((opt) => (
                        <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
                            <div className="flex items-center gap-2">
                                {opt.icon && <opt.icon className="size-5 text-default-400" />}
                                <span>{opt.label}</span>
                            </div>
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
        </Select>
    );
};