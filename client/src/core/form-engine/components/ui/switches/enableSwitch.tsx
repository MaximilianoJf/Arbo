import {
    Pencil,
    Power,
} from "@gravity-ui/icons";
import { Switch } from "@heroui/react";
import { useFormStore } from "@/core/form-engine/store";
import { FORM_MODES } from "@/core/form-engine/constants/form-modes";




//De momento aceptar creeate para ver su ui

export const EnableSwitch = () => {

    const { schemaMode, setSchemaMode } = useFormStore();
    const modeSelected = schemaMode === FORM_MODES.edit || schemaMode === FORM_MODES.view;

    const setIsSelected = () => {
        console.log(schemaMode)
        return setSchemaMode(prev => prev === FORM_MODES.edit ? FORM_MODES.view : FORM_MODES.edit)
    }

    return (
        <>
            <div>
                {modeSelected && (
                    <div className="flex gap-3">
                        <Switch defaultSelected size="lg" onChange={setIsSelected}>
                            {({ isSelected }) => (
                                <>
                                    <Switch.Control className={isSelected ? "dark:bg-green-500/80 bg-accent" : ""}>
                                        <Switch.Thumb>
                                            <Switch.Icon>
                                                {isSelected ? (
                                                    <Pencil className="size-3 text-inherit opacity-100" />
                                                ) : (
                                                    <Power className="size-3 text-inherit opacity-70" />
                                                )}
                                            </Switch.Icon>
                                        </Switch.Thumb>
                                    </Switch.Control>
                                </>
                            )}
                        </Switch>
                    </div>
                )}
            </div>
        </>
    );
}