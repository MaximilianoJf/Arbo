
import type { ActionFunctionArgs } from "react-router-dom";
import { DynamicForm } from "../../../components";
import { registerFields } from "../constants";

export const registerAction = async ({ request }: ActionFunctionArgs) => {
    const data = Object.fromEntries(await request.formData());
    console.log(data);
    return {}
}

export const RegisterView = () => {
    return (
        <>
            <div className="flex gap-5 flex-col items-center">
                <h1 className="text-4xl font-bold text-foreground/80 text-center">
                    Register
                </h1>
                <DynamicForm dynamicFormConfig={registerFields} />
            </div>
        </>
    )
}