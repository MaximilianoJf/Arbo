import { FormFunctions } from "../services";
/**
 * 1. TIPOS DE UI Y COMPONENTES
 * Definen los Fields (Nombre, Label, Placeholder, etc).
 */
export type ComponentType = 
  | "DynamicTextField" 
  | "DynamicPasswordWithToggle";

  
export type FormMode = 'view' | 'edit' | 'create' | 'preview';

export type FormSchema = {
    tittle: string;
    onSubmit?: FormFunctionsType;
    fields: FormField[];
};


export interface FormField {
    id?: string;
    name: string;
    label?: string;
    placeholder?: string;
    type: string; 
    componentType: ComponentType;
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    error?: string | null;
    dependencies?: string[];
    validate?: (value: string | number, allValues?: AllValues) => string | null;
}


/**
 * 2. TIPOS DE DATOS (PAYLOADS)
 * Representan la información que viaja entre estados y servicios.
 */

// Estado interno para cálculos y validaciones rápidas
export type AllValues = Record<string, string | number>;

// Datos crudos extraídos directamente del DOM (FormData)
// Se usa K extends string para mapear las llaves de tu config dinámica.
export type FormPayload = Record<string, FormDataEntryValue>;

/**
 * 3. TIPOS DE ACCIONES Y HANDLERS
 * Definen cómo se procesa la información al hacer submit.
 */

// Handler para funciones de envío internas
export type FormSubmitHandler = (data: AllValues) => void;

// Firma para servicios externos de base de datos o API
export type FormActionFn = (data: FormPayload) => void | Promise<void>;

// Tipado dinámico basado en tu archivo de servicios centralizado

export type FormFunctionsType = typeof FormFunctions[keyof typeof FormFunctions];
