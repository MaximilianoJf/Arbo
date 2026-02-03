
import { DynamicForm } from "../../components";
import { loginFields } from "../../config";
import type { ActionFunctionArgs } from "react-router-dom";

export const loginAction = async ({ request }: ActionFunctionArgs) => {
    const data = Object.fromEntries(await request.formData());
    console.log(data);
    return {}
}

export const LoginView = () => {

    return (
        <>
            <div className="flex gap-5 flex-col items-center">
                <h1 className="text-4xl font-bold text-foreground/80 text-center">
                    LOGIN
                </h1>
                <DynamicForm dynamicFormConfig={loginFields} />
            </div>
        </>
    )
}

