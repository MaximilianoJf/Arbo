import { DynamicForm } from "./components";
import type { FormSchema } from "./types";
import { FormProvider } from "./store/FormContext";
import { FormFunctions } from "./services";
import type { FormMode } from "./types";
import { FORM_MODES } from "./constants/form-modes";


export interface FormInstanceProps {
    formSchema: FormSchema;
    mode: FormMode;
    isSystemForm: boolean;
}

const emptySchema: FormSchema = {
    title: 'Nuevo Formulario',
    onSubmit: FormFunctions.SaveToDB,
    fields: [],
};

export const FormBuilder = ({
    formSchema = emptySchema,
    mode = FORM_MODES.create,
    isSystemForm = false
}: FormInstanceProps) => {

    return (
        <div className="flex flex-row w-full justify-center  items-center gap-5" >

            <FormProvider

                initialSchema={formSchema}
                mode={mode}
                isSystemForm={isSystemForm}>


                {/* <div className="w-[15%]">
                    <SideBar />
                </div> */}

                <div>
                    <DynamicForm />
                </div>

            </FormProvider >

        </div >
    )
}