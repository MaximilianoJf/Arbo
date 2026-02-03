export type ComponentType = "TextField" | "TextArea" | "Select" | "PasswordWithToggle";

export interface FormField {
    name: string;
    label?: string;
    placeholder?: string;
    type: "text" | "email" | "password" | "number";
    componentType: ComponentType;
    value: string;
    error?: string | null;
    validate?: (value: string) => string | null;
    required?: boolean
    minLength?:number;
    maxLenght?:number;

}

