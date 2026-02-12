import { createContext, useState, type ReactNode } from "react";
import type { FormSchema } from "../types";
import type { FormMode } from "../types";

interface FormContextProps {
    schema: FormSchema;
    setSchema: React.Dispatch<React.SetStateAction<FormSchema>>;
    isSystemForm: boolean;
    schemaMode: FormMode;
    setSchemaMode: React.Dispatch<React.SetStateAction<FormMode>>;
}

export const FormContext = createContext<FormContextProps | undefined>(undefined);

export const FormProvider = ({ children, initialSchema, mode, isSystemForm }: { children: ReactNode, initialSchema: FormSchema, mode: FormMode, isSystemForm: boolean }) => {
    const [schema, setSchema] = useState<FormSchema>(initialSchema);
    const [schemaMode, setSchemaMode] = useState<FormMode>(mode);

    const contextValue: FormContextProps = {
        schema,
        setSchema,
        isSystemForm,
        schemaMode: schemaMode,
        setSchemaMode: setSchemaMode
    };

    return (
        <FormContext.Provider value={contextValue}>
            {children}
        </FormContext.Provider>
    );
}