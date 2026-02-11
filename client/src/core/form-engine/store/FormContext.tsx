import { createContext, useState, type ReactNode } from "react";
import type { FormSchema } from "../types";
import type { FormMode } from "../types";

interface FormContextProps {
    schema: FormSchema;
    setSchema: React.Dispatch<React.SetStateAction<FormSchema>>;
    isSystemForm: boolean;
    mode: FormMode;
    setMode: (mode: FormMode) => void;
}

export const FormContext = createContext<FormContextProps | undefined>(undefined);

export const FormProvider = ({ children, initialSchema, mode, isSystemForm }: { children: ReactNode, initialSchema: FormSchema, mode: FormMode, isSystemForm: boolean }) => {
    const [schema, setSchema] = useState<FormSchema>(initialSchema);
    const [currentMode, setSchemaMode] = useState<FormMode>(mode);

    const contextValue: FormContextProps = {
        schema,
        setSchema,
        isSystemForm,
        mode: currentMode,
        setMode: setSchemaMode
    };

    return (
        <FormContext.Provider value={contextValue}>
            {children}
        </FormContext.Provider>
    );
}