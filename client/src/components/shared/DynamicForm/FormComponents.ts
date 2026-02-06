import { TextArea, Select } from "@heroui/react";
import type { ComponentType } from "../../../interfaces";
import { DynamicPasswordWithToggle } from "./FormComponents/DynamicPasswordWithToggle";
import { DynamicTextField } from "./FormComponents/DynamicTextField";

const FormComponentMap: Record<ComponentType, React.ElementType> = {
    TextArea: TextArea,
    Select: Select,
    DynamicPasswordWithToggle: DynamicPasswordWithToggle,
    DynamicTextField: DynamicTextField,
};

export default FormComponentMap