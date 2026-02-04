export type ComponentType = "DynamicTextField" | "TextArea" | "Select" | "DynamicPasswordWithToggle";
export type allValues = Record<string, string | number>;

export interface FormField {
    name: string;
    label?: string;
    placeholder?: string;
    type: "text" | "email" | "password" | "number";
    componentType: ComponentType;
    value: string | number;
    validate?: (value: string, allValues?: allValues) => string | null;
    required?: boolean
    minLength?:number;
    maxLenght?:number;
    error?: string | null;
}

