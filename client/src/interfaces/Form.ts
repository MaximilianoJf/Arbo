export type ComponentType = "TextField" | "TextArea" | "Select" | "PasswordWithToggle";

export interface FormField {
    name: string;
    label?: string;
    placeholder?: string;
    type: "text" | "email" | "password" | "number";
    componentType: ComponentType;
    value: string | number;
    validate?: (value: string | number, allValues?: Record<string, string | number>) => string | null;
    required?: boolean
    minLength?:number;
    maxLenght?:number;
    error?: string | null;
}

