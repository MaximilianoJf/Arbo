"use client";

import type { Key } from "@heroui/react";

import { Label, ListBox, Select, type SelectProps } from "@heroui/react";
import React from "react";


interface CustomMultipleSelectProps extends Omit<SelectProps<object, "multiple">, "children" | "value"> {
    options: string[];
    value?: string[];
    onChangeSelect?: any;
    label?: string;
}

export function CustomMultipleSelect({ options, value, onChangeSelect, label, ...props }: CustomMultipleSelectProps) {

    const [selected, setSelected] = React.useState<Key[]>(value || []);

    const handleChange = (keys: any) => {
        const arrayKeys = Array.from(keys) as Key[];

        setSelected(arrayKeys);

        onChangeSelect({
            target: {
                name: name,
                value: arrayKeys
            }
        });
    };

    return (

        <Select
            {...props}
            className="w-full"
            selectionMode="multiple"
            onChange={handleChange}
        >
            <Label>{label}</Label>
            <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="border border-default">
                <ListBox selectionMode="multiple">
                    {options?.map((option) => (
                        <ListBox.Item key={option} id={option} textValue={option}>
                            {option}
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
        </Select>

    );
}