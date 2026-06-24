import { useTranslation } from "react-i18next";
import { Check } from "@gravity-ui/icons";
import { getSubmitActions } from "../../../constants/editor-constants";
import { FormFunctions, parseSubmitActions } from "../../../services";
import { useEditorContext } from "../EditorContext";

export const SubmitTab = () => {
    const { t } = useTranslation();
    const { schema, setSchema, styles, updateStyles } = useEditorContext();
    const SUBMIT_ACTIONS = getSubmitActions(t);
    const selected = parseSubmitActions(schema.onSubmit);
    const requiresGoogleAuth = !!styles.requiresGoogleAuth;
    const allowMultiple = !!styles.allowMultiple;
    // requiresParentChain defaults to true (strict): a nested form must be opened from its parent's link.
    // When turned off, the nested form can also be answered on its own.
    const allowStandalone = styles.requiresParentChain === false;

    const toggleAction = (value: string) => {
        const isOn = selected.includes(value);
        // Always keep at least one action selected
        if (isOn && selected.length === 1) return;
        const next = isOn ? selected.filter((a) => a !== value) : [...selected, value];
        setSchema((prev) => ({ ...prev, onSubmit: next.join(",") }));
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.submitTab.title")}</label>
                <p className="text-[9px] arbo-text-muted mb-3">{t("editor.submitTab.subtitle")}</p>
                <div className="flex flex-col gap-2">
                    {SUBMIT_ACTIONS.map((a) => {
                        const isOn = selected.includes(a.value);
                        const isLastOn = isOn && selected.length === 1;
                        return (
                            <button
                                key={a.value}
                                onClick={() => toggleAction(a.value)}
                                title={isLastOn ? "Debe quedar al menos una acción seleccionada" : undefined}
                                className={`flex items-start gap-3 px-3 py-3 rounded-lg border text-left transition-colors ${
                                    isOn
                                        ? "bg-[var(--arbo-accent-muted)] border-[var(--arbo-accent)]/40 text-[var(--arbo-accent)]"
                                        : "bg-[var(--arbo-surface-2)] border-[var(--arbo-border)] arbo-text-secondary hover:border-[var(--arbo-border-light)]"
                                }`}
                            >
                                <div className={`size-3.5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                                    isOn ? "border-[var(--arbo-accent)] bg-[var(--arbo-accent)]" : "border-[var(--arbo-border)]"
                                }`}>
                                    {isOn && <Check className="size-2.5 text-[var(--arbo-bg)]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium block">{a.label}</span>
                                    <span className="text-[9px] arbo-text-muted block mt-0.5">
                                        {a.value === FormFunctions.SaveToDB
                                            ? t("editor.submitTab.saveToDb")
                                            : t("editor.submitTab.sendEmail")}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
                <p className="text-[9px] arbo-text-muted italic mt-2">Podés combinar acciones — siempre debe quedar al menos una activa.</p>
            </div>

            <div className="border-t border-[var(--arbo-border)]" />

            {/* Access gate — require Google sign-in */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-2">Identidad</label>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <div className="min-w-0">
                        <span className="text-xs font-medium arbo-text">Requerir inicio de sesión con Google</span>
                        <p className="text-[9px] arbo-text-muted mt-0.5">Solo usuarios autenticados pueden responder. Identifica con certeza a cada persona — ideal para formularios relacionados.</p>
                    </div>
                    <button
                        onClick={() => updateStyles({ requiresGoogleAuth: !requiresGoogleAuth })}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${requiresGoogleAuth ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                    >
                        <div className={`size-4 rounded-full bg-white transition-transform ${requiresGoogleAuth ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between gap-3 px-3 py-2.5 mt-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <div className="min-w-0">
                        <span className="text-xs font-medium arbo-text">Permitir múltiples registros</span>
                        <p className="text-[9px] arbo-text-muted mt-0.5">Una misma cuenta puede enviar varias respuestas. Ideal para registros internos — ej.: un administrador que crea muchos clientes o mascotas. Si está apagado, cada usuario responde una sola vez.</p>
                    </div>
                    <button
                        onClick={() => updateStyles({ allowMultiple: !allowMultiple })}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${allowMultiple ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                    >
                        <div className={`size-4 rounded-full bg-white transition-transform ${allowMultiple ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between gap-3 px-3 py-2.5 mt-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <div className="min-w-0">
                        <span className="text-xs font-medium arbo-text">Permitir responder suelto (sin venir del formulario padre)</span>
                        <p className="text-[9px] arbo-text-muted mt-0.5">Solo aplica a formularios anidados. Si está apagado, este formulario únicamente se puede responder desde el link de una respuesta del formulario padre. Si lo encendés, también se puede responder por su cuenta — en ese caso ya no se exige que venga encadenado.</p>
                    </div>
                    <button
                        onClick={() => updateStyles({ requiresParentChain: allowStandalone })}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${allowStandalone ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                    >
                        <div className={`size-4 rounded-full bg-white transition-transform ${allowStandalone ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>

            {/* Current selection summary */}
            <div className="px-3 py-2.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                <p className="text-[9px] arbo-text-muted mb-0.5">{t("editor.submitTab.selectedAction")}</p>
                <p className="text-xs font-semibold arbo-text">
                    {selected
                        .map((v) => SUBMIT_ACTIONS.find((a) => a.value === v)?.label || v)
                        .join(" + ")}
                </p>
            </div>
        </div>
    );
};
