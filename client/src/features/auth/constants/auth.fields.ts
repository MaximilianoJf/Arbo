import type { FormSchema } from "@/core/form-engine/types";

export const loginFields: FormSchema = {
    title: "Login",
    fields: [
        {
            name: "email",
            label: "Correo Electrónico",
            placeholder: "tu@ejemplo.com",
            type: "email",
            componentType: "DynamicTextField",
            value: "",
            required: true,
            validate: ["required", "email"],
        },
        {
            name: "password",
            label: "Contraseña",
            placeholder: "********",
            type: "password",
            componentType: "DynamicPasswordWithToggle",
            value: "",
            required: true,
            minLength: 6,
            validate: ["required", "minLength"],
        },
    ],
};

export const registerFields: FormSchema = {
    title: "Register",
    fields: [
        {
            name: "name",
            label: "Nombre",
            placeholder: "Tu nombre",
            type: "text",
            componentType: "DynamicTextField",
            value: "",
            required: true,
            validate: ["required"],
        },
        {
            name: "email",
            label: "Correo Electrónico",
            placeholder: "tu@ejemplo.com",
            type: "email",
            componentType: "DynamicTextField",
            value: "",
            required: true,
            validate: ["required", "email"],
        },
        {
            name: "password",
            label: "Contraseña",
            placeholder: "Ingresa tu contraseña",
            type: "password",
            componentType: "DynamicPasswordWithToggle",
            value: "",
            required: true,
            minLength: 6,
            dependencies: ["confirmPassword"],
            validate: ["required", "minLength"],
        },
        {
            name: "confirmPassword",
            label: "Confirmar Contraseña",
            placeholder: "Confirma tu contraseña",
            type: "password",
            componentType: "DynamicPasswordWithToggle",
            value: "",
            required: true,
            minLength: 6,
            validate: ["required", "confirmPassword"],
        },
    ],
};
