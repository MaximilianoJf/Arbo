import { createContext, useContext, useState, type ReactNode } from 'react';
import type { FormField } from '../../../interfaces';
// 1. Definir los tipos de estado
type FormMode = 'edit' | 'show' | 'preview';

interface FormBuilderContextType {
    mode: FormMode;
    setMode: (mode: FormMode) => void;
    dynamicFormConfig: FormField[];
    setDynamicFormConfig: (config: FormField[]) => void;
    isEditing: boolean;
}


const FormBuilderContext = createContext<FormBuilderContextType | undefined>(undefined);

export const FormBuilderProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setMode] = useState<FormMode>('edit');

    const value = {
        mode,
        setMode,
        isEditing: mode === 'edit'
    };

    return (
        <FormBuilderContext.Provider value={value}>
            {children}
        </FormBuilderContext.Provider>
    );
};


export const useFormBuilder = () => {
    const context = useContext(FormBuilderContext);
    if (!context) {
        throw new Error("useFormBuilder debe usarse dentro de FormBuilderProvider");
    }
    return context;
};