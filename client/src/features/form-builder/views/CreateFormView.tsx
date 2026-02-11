import { FormBuilder } from "@/core/form-engine/FormBuilder"

import type { FormSchema } from "@/core/form-engine/types"
import { FORM_MODES } from "@/core/form-engine/components";

const formConfig: FormSchema = {
    'tittle': 'Formulario de prueba',
    'onSubmit': 'SaveToDB',
    'fields': [
        {
            id: crypto.randomUUID(),
            name: "email",
            label: "Correo Electrónico",
            placeholder: "tu@ejemplo.com",
            type: "email",
            componentType: "DynamicTextField",
            value: "",
            required: true,
            validate: (value, allValues?) => {
                const val = String(value);
                if (!val) return "El correo electrónico es requerido";
                if (!val.includes("@")) return "El correo electrónico debe tener un @";
                return null;
            }
        },
        {
            id: crypto.randomUUID(),
            name: "password",
            label: "Contraseña",
            placeholder: "********",
            type: "password",
            componentType: "DynamicPasswordWithToggle",
            value: "",
            required: true,
            minLength: 6,

            validate: (value, allValues?) => {
                const val = String(value);
                if (!val) return "La contraseña es requerida";
                if (val.length < 6) return "La contraseña debe tener al menos 6 caracteres";
                return null;
            }
        }
    ]
} as const;

export const CreateFormView = () => {

    return (
        <>
            <FormBuilder formSchema={formConfig} mode={FORM_MODES.create} isSystemForm={false} />
        </>
    )
}
