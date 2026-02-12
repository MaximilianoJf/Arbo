import { useContext, useState } from "react";
import { FormContext } from "./FormContext";
import type { FormField } from "../types";
import { useSubmit } from 'react-router-dom';
import { FORM_ACTIONS_MAP } from "../services";
import { useMemo } from "react";

export const useFormStore = () => {

  const submit = useSubmit();

  const context = useContext(FormContext);
  if (!context) throw new Error("...");

  const { schema, setSchema, schemaMode, setSchemaMode, isSystemForm } = context;

  const [formState, setFormState] = useState<Record<string, { value: string | number, error: string | null }>>(() => {
    return schema.fields.reduce((acc, field) => {
      acc[field.name] = {
        value: field.value,
        error: field.error ?? null
      };
      return acc;
    }, {} as Record<string, { value: string | number, error: string | null }>);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: { value, error: null } }));
    validateSubmit(name, value)
  };

  const allValues = useMemo(() => Object.entries(formState).reduce((acc, [key, field]) => {
    acc[key] = field.value;
    return acc;
  }, {} as Record<string, string | number>), [formState]);



  const validateSubmit = (inputName?: string, inputValue?: string | number): boolean => {
    return !inputName
      ? validateAllFields()
      : validateSingleField(inputName, inputValue!);
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();


    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (validateSubmit()) return;

    if (schema.onSubmit) {
      const actionToExecute = FORM_ACTIONS_MAP[schema.onSubmit];
      if (actionToExecute) {
        actionToExecute(data);
      }
      return;
    } else {
      submit(data as any, { method: "post" });
    }

  };

  const validateAllFields = (): boolean => {
    let isInvalid = false;
    const updatedState = { ...formState };

    schema.fields.forEach((field: FormField) => {
      if (!field.validate) return;

      const currentValue = updatedState[field.name].value;
      const error = field.validate(currentValue, allValues);

      updatedState[field.name] = {
        ...updatedState[field.name],
        error: error || null
      };

      if (error) isInvalid = !!error;
    });

    setFormState(updatedState);
    return isInvalid;
  };

  const validateSingleField = (inputName: string, inputValue: string | number): boolean => {
    const field = schema.fields.find(f => f.name === inputName);
    if (!field || !field.validate) return false;

    const currentValues = { ...allValues, [inputName]: inputValue };
    const error = field.validate(inputValue, currentValues);

    setFormState(prev => {
      const newState = {
        ...prev,
        [inputName]: { ...prev[inputName], value: inputValue, error: error || null }
      };

      field.dependencies?.forEach(depName => {
        const depField = schema.fields.find(f => f.name === depName);
        const depState = prev[depName];

        if (depField?.validate && depState) {
          const depError = depField.validate(depState.value, currentValues);
          newState[depName] = { ...depState, error: depError || null };
        }
      });

      return newState;
    });

    return !!error;
  };

  const resetForm = (() => {
    setFormState(() => {
      return schema.fields.reduce((acc, field) => {
        acc[field.name] = {
          value: field.value,
          error: field.error ?? null
        };
        return acc;
      }, {} as Record<string, { value: string | number, error: string | null }>);
    });
  })




  const addField = (field: FormField) => {
    setSchema(prev => (
      {
        ...prev,
        fields: [...prev.fields, field]
      }
    ))
  }

  return { formState, setFormState, handleSubmit, handleInputChange, schema, setSchema, addField, schemaMode, setSchemaMode, isSystemForm, validateSubmit, validateAllFields, validateSingleField, resetForm };
};