import type { AllValues } from '../interfaces';

export const flattenFormState = (formState: Record<string, { value: string | number }>): AllValues => {
    return Object.entries(formState).reduce((acc, [key, field]) => {
        acc[key] = field.value;
        return acc;
    }, {} as AllValues);
};