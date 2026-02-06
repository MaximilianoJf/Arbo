
type FormActionFn = (data: any) => void | Promise<void>;

const sendToEmail: FormActionFn  = (data) =>  console.log("Enviando Email...", data);
const saveToDB: FormActionFn = (data) => console.log("Guardando en BD...", data);

export const FormFunctions = {  
    SendToEmail: 'SendToEmail',
    SaveToDB: 'SaveToDB'
};

export type FormFunctionsType = typeof FormFunctions[keyof typeof FormFunctions];

export const FORM_ACTIONS_MAP: Record<FormFunctionsType, FormActionFn> = {
  [FormFunctions.SendToEmail]: sendToEmail,
  [FormFunctions.SaveToDB]: saveToDB,
};
