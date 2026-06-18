export const VALIDATION_PATTERNS = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    number: /^\d+$/,
    decimal: /^[0-9]+([.,][0-9]+)?$/,
    text: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    alphanumeric: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/,
    url: /^https?:\/\/.+\..+/,
    phone: /^[+]?[\d\s()-]{7,15}$/,
    noSpaces: /^\S+$/,
    rut: /^\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]$/,
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    hasNumber: /\d/,
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
};

export type ValueValidation = number | string;

export const VALIDATION_RULES: Record<string, (value: ValueValidation, allValues?: Record<string, any>, fieldName?: string) => string | null> = {
    required: (value) =>
        (value !== undefined && value !== null && String(value).trim() !== "")
            ? null : "This field is required",

    number: (value) =>
        (!value || VALIDATION_PATTERNS.number.test(String(value)))
            ? null : "Must be a number",

    email: (value) =>
        (!value || VALIDATION_PATTERNS.email.test(String(value)))
            ? null : "Must be a valid email",

    decimal: (value) =>
        (!value || VALIDATION_PATTERNS.decimal.test(String(value)))
            ? null : "Must be a valid decimal number",

    text: (value) =>
        (!value || VALIDATION_PATTERNS.text.test(String(value)))
            ? null : "Only letters and spaces allowed",

    alphanumeric: (value) =>
        (!value || VALIDATION_PATTERNS.alphanumeric.test(String(value)))
            ? null : "Only letters, numbers and spaces allowed",

    url: (value) =>
        (!value || VALIDATION_PATTERNS.url.test(String(value)))
            ? null : "Must be a valid URL (http:// or https://)",

    phone: (value) =>
        (!value || VALIDATION_PATTERNS.phone.test(String(value)))
            ? null : "Must be a valid phone number",

    rut: (value) =>
        (!value || VALIDATION_PATTERNS.rut.test(String(value)))
            ? null : "Debe ser un RUT válido (ej: 12.345.678-9)",

    noSpaces: (value) =>
        (!value || VALIDATION_PATTERNS.noSpaces.test(String(value)))
            ? null : "Must not contain spaces",

    minLength: (value) =>
        (!value || String(value).length >= 6)
            ? null : "Must be at least 6 characters",

    minLength3: (value) =>
        (!value || String(value).length >= 3)
            ? null : "Must be at least 3 characters",

    minLength8: (value) =>
        (!value || String(value).length >= 8)
            ? null : "Must be at least 8 characters",

    maxLength50: (value) =>
        (!value || String(value).length <= 50)
            ? null : "Must be 50 characters or less",

    maxLength100: (value) =>
        (!value || String(value).length <= 100)
            ? null : "Must be 100 characters or less",

    maxLength255: (value) =>
        (!value || String(value).length <= 255)
            ? null : "Must be 255 characters or less",

    confirmPassword: (value, allValues?, fieldName?: string) => {
        // Extract the password field name from companion field name
        // If field is "password_confirm", password field is "password"
        // If field is "pwd_field_12345_confirm", password field is "pwd_field_12345"
        let passwordFieldName = "password"; // fallback
        if (fieldName && fieldName.endsWith("_confirm")) {
            passwordFieldName = fieldName.slice(0, -8); // Remove "_confirm" suffix
        }
        return (value === allValues?.[passwordFieldName])
            ? null : "Passwords do not match";
    },

    strongPassword: (value) => {
        const v = String(value);
        if (!v) return null;
        if (v.length < 8) return "Password must be at least 8 characters";
        if (!VALIDATION_PATTERNS.uppercase.test(v)) return "Must contain an uppercase letter";
        if (!VALIDATION_PATTERNS.lowercase.test(v)) return "Must contain a lowercase letter";
        if (!VALIDATION_PATTERNS.hasNumber.test(v)) return "Must contain a number";
        if (!VALIDATION_PATTERNS.hasSpecialChar.test(v)) return "Must contain a special character";
        return null;
    },

    positiveNumber: (value) => {
        if (!value) return null;
        const n = Number(value);
        return (isNaN(n) || n <= 0) ? "Must be a positive number" : null;
    },

    minValue0: (value) => {
        if (!value) return null;
        return Number(value) < 0 ? "Must be 0 or greater" : null;
    },

    maxValue100: (value) => {
        if (!value) return null;
        return Number(value) > 100 ? "Must be 100 or less" : null;
    },

    date: (value) => {
        if (!value) return null;
        const d = new Date(String(value));
        return isNaN(d.getTime()) ? "Must be a valid date" : null;
    },

    futureDate: (value) => {
        if (!value) return null;
        const d = new Date(String(value));
        if (isNaN(d.getTime())) return "Must be a valid date";
        return d <= new Date() ? "Must be a future date" : null;
    },

    pastDate: (value) => {
        if (!value) return null;
        const d = new Date(String(value));
        if (isNaN(d.getTime())) return "Must be a valid date";
        return d >= new Date() ? "Must be a past date" : null;
    },
};

export interface PatternConfig {
    pattern?: string;
    patternMessage?: string;
}

export const getValidationFn = (keys: string[], fieldName?: string, patternCfg?: PatternConfig) => {
    return (value: ValueValidation, allValues?: Record<string, any>): string | null => {
        for (const key of keys) {
            const rule = VALIDATION_RULES[key];
            if (rule) {
                const error = rule(value, allValues, fieldName);
                if (error) return error;
            }
        }
        // Custom per-field regex (configured in the editor)
        if (patternCfg?.pattern && value !== undefined && value !== null && String(value) !== "") {
            try {
                const re = new RegExp(patternCfg.pattern);
                if (!re.test(String(value))) {
                    return patternCfg.patternMessage || "El valor no tiene el formato esperado";
                }
            } catch {
                // Invalid regex configured — don't block the user
            }
        }
        return null;
    };
};
