import {
    Pencil,
    Power,
} from "@gravity-ui/icons";
import { Switch } from "@heroui/react";
import { useFormStore } from "@/core/form-engine/store";
import { FORM_MODES } from "@/core/form-engine/constants/form-modes";

export const EnableSwitch = () => {

    const { mode, setMode } = useFormStore();


    //De momento aceptar creeate para ver su ui
    const modeSelected = mode === FORM_MODES.edit || mode === FORM_MODES.create;

    return (
        <>
            <div>
                {modeSelected && (
                    <div className="flex gap-3">

                        <Switch defaultSelected size="lg">
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