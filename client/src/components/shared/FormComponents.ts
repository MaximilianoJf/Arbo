import { TextField, TextArea, Select } from "@heroui/react";
import type { ComponentType } from "../../interfaces";
import { PasswordWithToggle } from "../ui";

const FormComponentMap: Record<ComponentType, React.ElementType> = {
    TextField: TextField,
    TextArea: TextArea,
    Select: Select,
    PasswordWithToggle: PasswordWithToggle,
};

export default FormComponentMap