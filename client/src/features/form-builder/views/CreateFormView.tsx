import { DynamicForm } from "../../../components"
import { FormFunctions } from "../../../services"

//falsear una config
import { registerFields } from "../../auth/constants"

export const CreateFormView = () => {
    return (
        <>
            <div className="flex flex-row  w-full gap-4">

                <div className="bg-background w-[30%]">hola</div>
                <DynamicForm dynamicFormConfig={registerFields} onsubmit={FormFunctions.SendToEmail}></DynamicForm>



            </div>
        </>
    )
}
