import type { FieldRenderMap as FieldRenderMapType } from "../types";
import { DynamicTextField } from "./fields/DynamicTextField";
import { DynamicPasswordWithToggle } from "./fields/DynamicPasswordWithToggle";
import { DynamicTextArea } from "./fields/DynamicTextArea";
import { DynamicNumberField } from "./fields/DynamicNumberField";
import { DynamicCheckbox } from "./fields/DynamicCheckbox";
import { DynamicRadioGroup } from "./fields/DynamicRadioGroup";
import { DynamicSelect } from "./fields/DynamicSelect";
import { DynamicMultiSelect } from "./fields/DynamicMultiSelect";
import { DynamicDateField } from "./fields/DynamicDateField";
import { DynamicFileUpload } from "./fields/DynamicFileUpload";
import {
    Text as TextIcon,
    Key as KeyIcon,
    TextAlignLeft,
    Hashtag,
    SquareCheck,
    CircleDashed,
    ChevronDown,
    ListUl,
    Calendar,
    Pencil,
    Paperclip,
} from "@gravity-ui/icons";

export const FieldRenderMap: FieldRenderMapType = {
    DynamicTextField: {
        name: "TextField",
        description: "Text field",
        component: DynamicTextField,
        icon: TextIcon,
        types: [
            { type: "text", validations: ["required", "text", "alphanumeric", "noSpaces", "phone", "rut", "minLength3", "minLength", "maxLength50", "maxLength100", "maxLength255"] },
            { type: "email", validations: ["required", "email"] },
            { type: "tel", validations: ["required", "phone"] },
            { type: "url", validations: ["required", "url"] },
        ],
    },
    DynamicPasswordWithToggle: {
        name: "PasswordField",
        description: "Password with toggle",
        component: DynamicPasswordWithToggle,
        icon: KeyIcon,
        types: [
            { type: "password", validations: ["required", "minLength", "minLength8", "strongPassword", "confirmPassword", "noSpaces"] },
        ],
    },
    DynamicTextArea: {
        name: "TextArea",
        description: "Text area",
        component: DynamicTextArea,
        icon: TextAlignLeft,
        types: [
            { type: "text", validations: ["required", "text", "alphanumeric", "minLength3", "minLength", "maxLength100", "maxLength255"] },
        ],
    },
    DynamicNumberField: {
        name: "NumberField",
        description: "Number field",
        component: DynamicNumberField,
        icon: Hashtag,
        types: [
            { type: "number", validations: ["required", "number", "positiveNumber", "minValue0", "maxValue100"] },
            { type: "decimal", validations: ["required", "decimal", "positiveNumber", "minValue0", "maxValue100"] },
        ],
    },
    DynamicCheckbox: {
        name: "Checkbox",
        description: "Checkbox",
        component: DynamicCheckbox,
        icon: SquareCheck,
        types: [
            { type: "checkbox", validations: ["required"] },
        ],
    },
    DynamicRadioGroup: {
        name: "RadioGroup",
        description: "Radio buttons",
        component: DynamicRadioGroup,
        icon: CircleDashed,
        types: [
            { type: "radio", validations: ["required"] },
        ],
    },
    DynamicSelect: {
        name: "Select",
        description: "Dropdown select",
        component: DynamicSelect,
        icon: ChevronDown,
        types: [
            { type: "select", validations: ["required"] },
        ],
    },
    DynamicMultiSelect: {
        name: "MultiSelect",
        description: "Dropdown multi-selection",
        component: DynamicMultiSelect,
        icon: ListUl,
        types: [
            { type: "multiselect", validations: ["required"] },
        ],
    },
    DynamicDateField: {
        name: "DateField",
        description: "Date picker",
        component: DynamicDateField,
        icon: Calendar,
        types: [
            { type: "date", validations: ["required", "date", "futureDate", "pastDate"] },
            { type: "datetime", validations: ["required", "futureDate", "pastDate"] },
        ],
    },
    DynamicFileUpload: {
        name: "FileUpload",
        description: "File / image upload",
        component: DynamicFileUpload,
        icon: Paperclip,
        types: [
            { type: "file", validations: ["required"] },
            { type: "image", validations: ["required"] },
        ],
    },
};
