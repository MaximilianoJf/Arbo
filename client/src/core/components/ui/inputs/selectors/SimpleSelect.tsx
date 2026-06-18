import { Label, ListBox, Select as SelectHero, type SelectProps } from "@heroui/react";

interface SimpleSelectProps extends Omit<SelectProps<object, 'single'>, 'children'> {
    options: string[] | null;
    value: string;
    onChangeSelect?: any;
    name?: string;
    label?: string;

}


export function SimpleSelect({ options, value, onChangeSelect, name, label, ...props }: SimpleSelectProps) {

    const states = () => {
        return options?.map((option) => ({
            id: option,
            name: option
        })) || [];
    }

    return (
        <SelectHero
            {...props}
            name={name}
            className="w-fi"
            value={value}
            onChange={(value) => {
                onChangeSelect({
                    target: {
                        name: name,
                        value: String(value)
                    }
                });
            }}
        >
            <Label>{label}</Label>
            <SelectHero.Trigger>
                <SelectHero.Value />
                <SelectHero.Indicator />
            </SelectHero.Trigger>
            <SelectHero.Popover className="border border-default">
                <ListBox >
                    {states().map((state) => (
                        <ListBox.Item key={state.id} id={state.id} textValue={state.name}>
                            {state.name}
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    ))}
                </ListBox>
            </SelectHero.Popover>
        </SelectHero>
    );
}