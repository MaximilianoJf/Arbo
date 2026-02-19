import type { FieldRenderMap as FieldRenderMapType } from "../types";
import { DynamicPasswordWithToggle } from "../fields"
import { DynamicTextField } from "../fields";
import { Text as TextIcon, Key as KeyIcon } from "@gravity-ui/icons";


export const FieldRenderMap: FieldRenderMapType = {
    'DynamicTextField': {
        name: 'TextField',
        description: 'Text field',
        component: DynamicTextField,
        icon: TextIcon,
        types: [
            {
                type: 'text',
                validations: ['required', 'number'],
            },
            {
                'type': 'email',
                validations: ['required', 'email'],
            },
            {
                'type': 'number',
                validations: ['required'],
            },
        ],
    },
    'DynamicPasswordWithToggle': {
        name: 'PasswordField',
        description: 'Password with toggle',
        component: DynamicPasswordWithToggle,
        icon: KeyIcon,
        types: [
            {
                'type': 'password',
                validations: ['required'],
            },

        ],
    },
};
