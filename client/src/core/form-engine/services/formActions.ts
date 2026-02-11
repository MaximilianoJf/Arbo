import type { FormFunctionsType } from "../types";
import type { FormActionFn } from "../types";

export const FormFunctions = {  
    SendToEmail: 'SendToEmail',
    SaveToDB: 'SaveToDB'
} as const;


const sendToEmail: FormActionFn  = (data) =>  console.log("Enviando Email...", data);
const saveToDB: FormActionFn = (data) => console.log("Guardando en BD...", data);


export const FORM_ACTIONS_MAP: Record<FormFunctionsType, FormActionFn> = {
  [FormFunctions.SendToEmail]: sendToEmail,
  [FormFunctions.SaveToDB]: saveToDB,
};
