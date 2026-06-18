import type { ContactField } from "../types";
import { DEFAULT_CONTACT_FIELDS } from "../constants/editor-constants";

/** The contact fields that should render: configured ones (or defaults), filtered to enabled. */
export const getEnabledContactFields = (styles: any): ContactField[] =>
    (styles?.contactFields || DEFAULT_CONTACT_FIELDS).filter((cf: ContactField) => cf.enabled);

/**
 * Returns the label of the first required-but-empty contact field, or null when
 * every required field has a value. Used to block submit when the contact panel is on.
 */
export const firstMissingRequiredContact = (
    fields: ContactField[],
    values: Record<string, string>,
): string | null => {
    for (const cf of fields) {
        if (cf.required && !(values[cf.name] || "").trim()) return cf.label;
    }
    return null;
};
