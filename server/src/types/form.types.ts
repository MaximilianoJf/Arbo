export interface CreateFormFieldInput {
    name: string;
    label?: string;
    placeholder?: string;
    type: string;
    componentType: string;
    defaultValue?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    sortOrder?: number;
    page?: number;
    validations?: string[];
    dependencies?: string[];
    options?: string[];
    fieldStyles?: Record<string, any>;
}

export interface FormStyles {
    accentColor?: string;
    bgColor?: string;
    pageBgColor?: string;
    gradient?: string;
    cardSize?: "sm" | "md" | "lg" | "xl";
    contactSize?: "sm" | "md" | "lg";
    borderRadius?: number;
    borderColor?: string;
    shadowStyle?: string;
    preset?: string;
    cardOpacity?: number;
    cardBlur?: number;
    globalFieldStyles?: Record<string, any>;
    contactEnabled?: boolean;
    contactPosition?: "left" | "right";
    contactFields?: any[];
    embedContactEnabled?: boolean;
    embedContactPosition?: "left" | "right";
    embedBgTransparent?: boolean;
}

export interface CreateFormInput {
    title: string;
    description?: string;
    onSubmit?: string;
    styles?: FormStyles;
    fields: CreateFormFieldInput[];
    projectId?: number | null;
}

export interface UpdateFormInput {
    title?: string;
    description?: string;
    onSubmit?: string;
    isPublished?: boolean;
    styles?: FormStyles;
    fields?: CreateFormFieldInput[];
    projectId?: number | null;
}
