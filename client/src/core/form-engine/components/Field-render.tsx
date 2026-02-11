
import type { ComponentType } from "../types";
import { DynamicPasswordWithToggle } from "../fields"
import { DynamicTextField } from "../fields";


//Mis custom field tsx
export const FieldRender: Record<ComponentType, React.ElementType> = {

    DynamicPasswordWithToggle: DynamicPasswordWithToggle,
    DynamicTextField: DynamicTextField,
};

