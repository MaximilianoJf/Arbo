import type { ComponentType, ContactField } from "../types";

type TFn = (key: string, opts?: any) => string;

// --- Submit actions ---
export const getSubmitActions = (t: TFn) => [
    { value: "SaveToDB", label: t("formActions.saveToDb") },
    { value: "SendToEmail", label: t("formActions.sendEmail") },
] as const;

// --- Field type icons for the navigator ---
export const FIELD_TYPE_ICONS: Record<string, string> = {
    DynamicTextField: "Aa",
    DynamicPasswordWithToggle: "**",
    DynamicTextArea: "Tt",
    DynamicNumberField: "#",
    DynamicCheckbox: "☑",
    DynamicRadioGroup: "◉",
    DynamicSelect: "▾",
    DynamicDateField: "📅",
};

// --- Validation labels for display ---
export const getValidationLabels = (t: TFn): Record<string, string> => ({
    required: t("validations.required"),
    text: t("validations.lettersOnly"),
    alphanumeric: t("validations.alphanumeric"),
    noSpaces: t("validations.noSpaces"),
    minLength3: t("validations.min3"),
    minLength: t("validations.minLength"),
    minLength8: t("validations.min8"),
    maxLength50: t("validations.max50"),
    maxLength100: t("validations.max100"),
    maxLength255: t("validations.max255"),
    email: t("validations.validEmail"),
    url: t("validations.validUrl"),
    phone: "Teléfono válido",
    rut: "RUT válido (Chile)",
    strongPassword: t("validations.strongPassword"),
    confirmPassword: t("validations.confirmPassword"),
    number: t("validations.numbersOnly"),
    positiveNumber: t("validations.positiveNumber"),
    decimal: t("validations.decimalsAllowed"),
    minValue0: t("validations.minValue0"),
    maxValue100: t("validations.maxValue100"),
    date: t("validations.validDate"),
    futureDate: t("validations.futureDate"),
    pastDate: t("validations.pastDate"),
});

// --- Input palette for the "+" tab ---
export const getInputPalette = (t: TFn): { componentType: ComponentType; type: string; label: string; icon: string; description: string }[] => [
    { componentType: "DynamicTextField", type: "text", label: t("inputPalette.textField"), icon: "Aa", description: t("inputPalette.textFieldDesc") },
    { componentType: "DynamicTextField", type: "email", label: t("inputPalette.email"), icon: "@", description: t("inputPalette.emailDesc") },
    { componentType: "DynamicTextArea", type: "text", label: t("inputPalette.textArea"), icon: "Tt", description: t("inputPalette.textAreaDesc") },
    { componentType: "DynamicNumberField", type: "number", label: t("inputPalette.number"), icon: "#", description: t("inputPalette.numberDesc") },
    { componentType: "DynamicPasswordWithToggle", type: "password", label: t("inputPalette.password"), icon: "**", description: t("inputPalette.passwordDesc") },
    { componentType: "DynamicCheckbox", type: "checkbox", label: t("inputPalette.checkbox"), icon: "☑", description: t("inputPalette.checkboxDesc") },
    { componentType: "DynamicRadioGroup", type: "radio", label: t("inputPalette.radio"), icon: "◉", description: t("inputPalette.radioDesc") },
    { componentType: "DynamicSelect", type: "select", label: t("inputPalette.dropdown"), icon: "▾", description: t("inputPalette.dropdownDesc") },
    { componentType: "DynamicMultiSelect", type: "multiselect", label: "Selección múltiple", icon: "≡", description: "Dropdown con varias opciones seleccionables" },
    { componentType: "DynamicDateField", type: "date", label: t("inputPalette.date"), icon: "📅", description: t("inputPalette.dateDesc") },
    { componentType: "DynamicDateField", type: "datetime", label: "Fecha y hora", icon: "🕐", description: "Selector de fecha con hora" },
    { componentType: "DynamicFileUpload", type: "image", label: "Imagen", icon: "🖼", description: "Subida de imagen con previsualización" },
    { componentType: "DynamicFileUpload", type: "file", label: "Archivo", icon: "📎", description: "Subida de archivo (PDF, Word, etc.)" },
];

// --- Default contact fields ---
// Required by default: when someone opts into the contact panel, identifying
// the respondent is the whole point — so it's mandatory unless turned off.
export const DEFAULT_CONTACT_FIELDS: ContactField[] = [
    { id: "name", name: "respondentName", label: "Nombre", type: "text", placeholder: "Tu nombre", required: true, enabled: true },
    { id: "email", name: "respondentEmail", label: "Email", type: "email", placeholder: "tu@email.com", required: true, enabled: true },
];

// --- Preset color palettes ---
export const PRESET_COLORS = [
    "#4ADE80", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
    "#EF4444", "#06B6D4", "#10B981", "#F97316", "#6366F1",
];

export const PRESET_GRADIENTS = [
    "linear-gradient(135deg, #4ADE80, #06B6D4)",
    "linear-gradient(135deg, #8B5CF6, #EC4899)",
    "linear-gradient(135deg, #3B82F6, #8B5CF6)",
    "linear-gradient(135deg, #F59E0B, #EF4444)",
    "linear-gradient(135deg, #10B981, #3B82F6)",
    "linear-gradient(135deg, #EC4899, #F97316)",
];

// --- Card & contact sizes ---
export const CARD_SIZES: { value: string; label: string; width: string }[] = [
    { value: "sm", label: "Small", width: "480px" },
    { value: "md", label: "Medium", width: "640px" },
    { value: "lg", label: "Large", width: "800px" },
    { value: "xl", label: "Full", width: "100%" },
];

export const CONTACT_SIZES: { value: string; label: string; width: string }[] = [
    { value: "sm", label: "Small", width: "240px" },
    { value: "md", label: "Medium", width: "320px" },
    { value: "lg", label: "Large", width: "400px" },
];

// --- Tab definitions ---
export type EditorTabKey = "inputs" | "field" | "form" | "page" | "embed" | "submit" | "ai" | "logic";

export const EDITOR_TABS: { key: EditorTabKey; label: string; glow?: boolean }[] = [
    { key: "ai", label: "IA", glow: true },
    { key: "inputs", label: "+" },
    { key: "field", label: "Campo" },
    { key: "form", label: "Form" },
    { key: "page", label: "Pagina" },
    { key: "embed", label: "Embed" },
    { key: "submit", label: "Submit" },
];

// --- Page heading sizes ---
export const PAGE_HEADING_SIZES = [
    { value: "sm", label: "S", css: "text-lg" },
    { value: "md", label: "M", css: "text-2xl" },
    { value: "lg", label: "L", css: "text-3xl" },
    { value: "xl", label: "XL", css: "text-4xl" },
];

// --- Animation presets ---
export const getAnimEntranceOptions = (t: TFn) => [
    { value: "none", label: t("animEntrance.none") },
    { value: "fadeIn", label: t("animEntrance.fadeIn") },
    { value: "slideUp", label: t("animEntrance.slideUp") },
    { value: "slideDown", label: t("animEntrance.slideDown") },
    { value: "scaleIn", label: t("animEntrance.scaleIn") },
    { value: "bounceIn", label: t("animEntrance.bounceIn") },
    { value: "flipIn", label: t("animEntrance.flipIn") },
] as const;

export const getAnimHoverOptions = (t: TFn) => [
    { value: "none", label: t("animHover.none") },
    { value: "lift", label: t("animHover.lift") },
    { value: "glow", label: t("animHover.glow") },
    { value: "scale", label: t("animHover.scale") },
    { value: "tilt", label: t("animHover.tilt") },
    { value: "borderPulse", label: t("animHover.borderPulse") },
] as const;

export const getAnimFieldFocusOptions = (t: TFn) => [
    { value: "none", label: t("animFieldFocus.none") },
    { value: "glow", label: t("animFieldFocus.glow") },
    { value: "scale", label: t("animFieldFocus.scale") },
    { value: "slideRight", label: t("animFieldFocus.slideRight") },
    { value: "borderGlow", label: t("animFieldFocus.borderGlow") },
] as const;

export const getAnimEasingOptions = (t: TFn) => [
    { value: "ease", label: t("animEasing.ease") },
    { value: "ease-in", label: t("animEasing.easeIn") },
    { value: "ease-out", label: t("animEasing.easeOut") },
    { value: "ease-in-out", label: t("animEasing.easeInOut") },
    { value: "linear", label: t("animEasing.linear") },
] as const;

export const getAnimSpeedOptions = (t: TFn) => [
    { value: "fast", label: t("animSpeed.fast"), ms: 150 },
    { value: "normal", label: t("animSpeed.normal"), ms: 250 },
    { value: "slow", label: t("animSpeed.slow"), ms: 400 },
] as const;

// --- Resize breakpoints ---
export const RESIZE_BREAKPOINTS = [
    { label: "375", title: "Mobile" },
    { label: "768", title: "Tablet" },
    { label: "1280", title: "Desktop" },
];
