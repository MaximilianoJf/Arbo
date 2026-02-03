import type { FormField } from "../interfaces"; 

export const loginFields: FormField[] = [
    {
        name: "email",
        label: "Correo Electrónico",
        placeholder: "tu@ejemplo.com",
        type: "email",
        componentType: "TextField",
        value: "",
        required: true,
        validate: (value: string) => {
            if (!value) return "El correo electrónico es requerido";
            if (!value.includes("@")) return "El correo electrónico debe tener un @";
            return null;
        }
    },
    {
        name: "password",
        label: "Contraseña",
        placeholder: "********",
        type: "password",
        componentType: "TextField",
        value: "",
        required: true,
        minLength: 6,
        validate: (value: string) => {
            if (!value) return "La contraseña es requerida";
            if (value.length < 6) return "La contraseña debe tener al menos 6 caracteres";
            return null;
        }
    }
] as const;

export const registerFields: FormField[] = [
    {
        name: "email",
        label: "Correo Electrónico",
        placeholder: "tu@ejemplo.com",
        type: "email",
        componentType: "TextField",
        value: "",
        required: true,
        validate: (value: string) => {
            if (!value) return "El correo electrónico es requerido";
            if (!value.includes("@")) return "El correo electrónico debe tener un @";
            return null;
        }
    },
    {
        name: "password",
        label: "Contraseña",
        placeholder: "********",
        type: "password",
        componentType: "PasswordWithToggle",
        value: "",
        required: true,
        minLength: 6,
        validate: (value: string) => {
            if (!value) return "La contraseña es requerida";
            if (value.length < 6) return "La contraseña debe tener al menos 6 caracteres";
            return null;
        }
    },
    {
        name: "confirmPassword",
        label: "Confirmar Contraseña",
        placeholder: "********",
        type: "password",
        componentType: "TextField",
        value: "",
        required: true,
        minLength: 6,
        validate: (value: string) => {
            if (!value) return "La contraseña es requerida";
            if (value.length < 6) return "La contraseña debe tener al menos 6 caracteres";
            return null;
        }
    }
] as const;
