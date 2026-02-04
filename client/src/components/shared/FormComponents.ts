import { TextArea, Select } from "@heroui/react";
import type { ComponentType } from "../../interfaces";
import { PasswordWithToggle } from "../ui";
import { TextField } from "../ui";

const FormComponentMap: Record<ComponentType, React.ElementType> = {
    TextArea: TextArea,
    Select: Select,
    PasswordWithToggle: PasswordWithToggle,
    TextField: TextField,
};

export default FormComponentMap