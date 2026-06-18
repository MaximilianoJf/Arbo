import { createContext, useState, type ReactNode } from "react";
import type { FormSchema, FormMode } from "../types";

interface FormContextProps {
    schema: FormSchema;
    setSchema: React.Dispatch<React.SetStateAction<FormSchema>>;
    isSystemForm: boolean;
    schemaMode: FormMode;
    setSchemaMode: React.Dispatch<React.SetStateAction<FormMode>>;
    onAuthSubmit?: (data: Record<string, any>) => void | Promise<void>;
    activePage: number;
    setActivePage: React.Dispatch<React.SetStateAction<number>>;
}

export const FormContext = createContext<FormContextProps | undefined>(undefined);

interface FormProviderProps {
    children: ReactNode;
    initialSchema: FormSchema;
    mode: FormMode;
    isSystemForm: boolean;
    onAuthSubmit?: (data: Record<string, any>) => void | Promise<void>;
}

export const FormProvider = ({ children, initialSchema, mode, isSystemForm, onAuthSubmit }: FormProviderProps) => {
    const [schema, setSchema] = useState<FormSchema>(initialSchema);
    const [schemaMode, setSchemaMode] = useState<FormMode>(mode);
    const [activePage, setActivePage] = useState(0);

    return (
        <FormContext.Provider value={{ schema, setSchema, isSystemForm, schemaMode, setSchemaMode, onAuthSubmit, activePage, setActivePage }}>
            {children}
        </FormContext.Provider>
    );
};
