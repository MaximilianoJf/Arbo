
import type { ActionFunctionArgs } from "react-router-dom";
import { DynamicForm } from "../../../components";
import { registerFields } from "../constants";
import { AuthCard } from "../components";

export const registerAction = async ({ request }: ActionFunctionArgs) => {
    const data = Object.fromEntries(await request.formData());
    console.log(data);
    return {}
}

export const RegisterView = () => {
    return (
        <>
            <AuthCard tittle="REGISTER">
                <DynamicForm dynamicFormConfig={registerFields} />
            </AuthCard>
        </>
    )
}