import { DynamicForm } from "./components";
import type { FormSchema } from "./types";
import { FormProvider } from "./store/FormContext";
import type { FormMode } from "./types";
import { FORM_MODES } from "./constants/form-modes";

export interface FormInstanceProps {
    formSchema: FormSchema;
    mode: FormMode;
    isSystemForm: boolean;
    onAuthSubmit?: (data: Record<string, any>) => void | Promise<void>;
}

export const FormBuilder = ({
    formSchema,
    mode = FORM_MODES.create,
    isSystemForm = false,
    onAuthSubmit,
}: FormInstanceProps) => {
    return (
        <div className="w-full">
            <FormProvider
                initialSchema={formSchema}
                mode={mode}
                isSystemForm={isSystemForm}
                onAuthSubmit={onAuthSubmit}
            >
                <DynamicForm />
            </FormProvider>
        </div>
    );
};
