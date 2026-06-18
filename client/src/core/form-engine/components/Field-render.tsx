import type { FieldRenderMap as FieldRenderMapType } from "../types";
import { DynamicTextField } from "./fields/DynamicTextField";
import { DynamicPasswordWithToggle } from "./fields/DynamicPasswordWithToggle";
import { DynamicTextArea } from "./fields/DynamicTextArea";
import { DynamicNumberField } from "./fields/DynamicNumberField";
import { DynamicCheckbox } from "./fields/DynamicCheckbox";
import { DynamicRadioGroup } from "./fields/DynamicRadioGroup";
import { DynamicSelect } from "./fields/DynamicSelect";
import { DynamicDateField } from "./fields/DynamicDateField";
import { DynamicSignature } from "./fields/DynamicSignature";
import {
    Text as TextIcon,
    Key as KeyIcon,
    TextAlignLeft,
    Hashtag,
    SquareCheck,
    CircleDashed,
    ChevronDown,
    Calendar,
    Pencil,
} from "@gravity-ui/icons";

export const FieldRenderMap: FieldRenderMapType = {
    DynamicTextField: {
        name: "TextField",
        description: "Text field",
        component: DynamicTextField,
        icon: TextIcon,
        types: [
            { type: "text", validations: ["required", "text", "alphanumeric", "noSpaces", "minLength3", "minLength", "maxLength50", "maxLength100", "maxLength255"] },
            { type: "email", validations: ["required", "email"] },
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
    DynamicDateField: {
        name: "DateField",
        description: "Date picker",
        component: DynamicDateField,
        icon: Calendar,
        types: [
            { type: "date", validations: ["required", "date", "futureDate", "pastDate"] },
        ],
    },
    DynamicSignature: {
        name: "Signature",
        description: "Signature pad",
        component: DynamicSignature,
        icon: Pencil,
        types: [
            { type: "signature", validations: ["required"] },
        ],
    },
};
