import type { FieldRender } from "./schema.types";

export type FieldSelectorOption = Pick<FieldRender, "icon" | "types"> & {
    label: string;
    value: string;
};

export type FieldSettingsFormState = {
    types: string[] | null;
    validations: any;
};