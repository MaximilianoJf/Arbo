import { TextArea, Select } from "@heroui/react";
import type { ComponentType } from "../../interfaces";
import { DynamicTextField , DynamicPasswordWithToggle} from "../ui";

const FormComponentMap: Record<ComponentType, React.ElementType> = {
    TextArea: TextArea,
    Select: Select,
    DynamicPasswordWithToggle: DynamicPasswordWithToggle,
    DynamicTextField: DynamicTextField,
};

export default FormComponentMap