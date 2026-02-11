
import type { ActionFunctionArgs } from "react-router-dom";
import { registerFields } from "../constants";
import { FormBuilder as RegisterForm } from "@/core/form-engine/FormBuilder";

export const registerAction = async ({ request }: ActionFunctionArgs) => {
    const data = Object.fromEntries(await request.formData());
    console.log(data);
    return {}
}

export const RegisterView = () => {
    return (
        <>
            <RegisterForm formSchema={registerFields} mode='view' isSystemForm={true} />
        </>
    )
}