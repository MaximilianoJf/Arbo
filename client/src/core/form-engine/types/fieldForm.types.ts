import type { FieldRender, FormField } from "./schema.types";

export type FieldSelectorOption = Pick<FieldRender, "icon" | "types"> & {
    label: string;
    value: string;
};


export type FormFieldSettings = Pick<FormField, "name" | "label" | "value"> & {
    icon: string;
    types: string[] | null;

};