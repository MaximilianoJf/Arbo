import { useContext, useState } from "react";
import { FormContext } from "./FormContext";   
import type { FormField } from "../types";


export const useFormStore = () => {

  const context = useContext(FormContext);
  if (!context) throw new Error("...");

  const { schema, setSchema, mode, setMode, isSystemForm } = context;

  const addField = (field: FormField) => {
    setSchema(prev => (
      { ...prev,
        fields: [...prev.fields, field]
      }
    ))
  }

  return { schema, setSchema, addField, mode, setMode, isSystemForm };
};