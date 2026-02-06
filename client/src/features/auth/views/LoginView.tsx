
import { DynamicForm } from "../../../components";
import { loginFields } from "../constants";
import type { ActionFunctionArgs } from "react-router-dom";
import { AuthCard } from "../components";

export const loginAction = async ({ request }: ActionFunctionArgs) => {
    const data = Object.fromEntries(await request.formData());
    console.log(data);
    return {}
}


export const LoginView = () => {
    return (
        <>
            <AuthCard tittle="LOGIN">
                <DynamicForm dynamicFormConfig={loginFields} />
            </AuthCard>
        </>
    )
}

