
import { FieldRenderMap } from "../components";
import type { FieldSelectorOption } from "../types";


export const FIELD_COMPONENTS: FieldSelectorOption[] = Object.entries(FieldRenderMap).map(
    ([key, value]) => ({
        label: value.description,
        value: key,
        icon: value.icon,
        types: value.types,
    })
);