
import { loginFields } from "../constants";
import type { ActionFunctionArgs } from "react-router-dom";
import { FormBuilder as LoginForm } from "@/core/form-engine/FormBuilder";

export const loginAction = async ({ request }: ActionFunctionArgs) => {
    const data = Object.fromEntries(await request.formData());
    console.log(data);
    return {}
}


export const LoginView = () => {
    return (
        <>
            <LoginForm formSchema={loginFields} mode='view' isSystemForm={true} />
        </>
    )
}

