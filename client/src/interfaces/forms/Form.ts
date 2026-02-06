export type ComponentType = "DynamicTextField" | "TextArea" | "Select" | "DynamicPasswordWithToggle";
export type AllValues = Record<string, string | number>;

export interface FormField {
    name: string;
    label?: string;
    placeholder?: string;
    type: "text" | "email" | "password" | "number";
    componentType: ComponentType;
    value: string | number;
    validate?: (value: string | number, allValues?: AllValues) => string | null;
    required?: boolean
    minLength?:number;
    maxLenght?:number;
    error?: string | null;
    dependencies?: string[];
}

export type FormSubmitHandler = (data: any) =>  void;