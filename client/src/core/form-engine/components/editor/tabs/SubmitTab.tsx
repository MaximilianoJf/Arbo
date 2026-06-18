import { useTranslation } from "react-i18next";
import { getSubmitActions } from "../../../constants/editor-constants";
import { FormFunctions } from "../../../services";
import { useEditorContext } from "../EditorContext";

export const SubmitTab = () => {
    const { t } = useTranslation();
    const { schema, setSchema } = useEditorContext();
    const SUBMIT_ACTIONS = getSubmitActions(t);

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.submitTab.title")}</label>
                <p className="text-[9px] arbo-text-muted mb-3">{t("editor.submitTab.subtitle")}</p>
                <div className="flex flex-col gap-2">
                    {SUBMIT_ACTIONS.map((a) => (
                        <button
                            key={a.value}
                            onClick={() => setSchema((prev) => ({ ...prev, onSubmit: a.value }))}
                            className={`flex items-start gap-3 px-3 py-3 rounded-lg border text-left transition-colors ${
                                (schema.onSubmit || FormFunctions.SaveToDB) === a.value
                                    ? "bg-[var(--arbo-accent-muted)] border-[var(--arbo-accent)]/40 text-[var(--arbo-accent)]"
                                    : "bg-[var(--arbo-surface-2)] border-[var(--arbo-border)] arbo-text-secondary hover:border-[var(--arbo-border-light)]"
                            }`}
                        >
                            <div className={`size-3.5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                                (schema.onSubmit || FormFunctions.SaveToDB) === a.value
                                    ? "border-[var(--arbo-accent)]"
                                    : "border-[var(--arbo-border)]"
                            }`}>
                                {(schema.onSubmit || FormFunctions.SaveToDB) === a.value && (
                                    <div className="size-1.5 rounded-full bg-[var(--arbo-accent)]" />
                                )}
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
                    ))}
                </div>
            </div>

            <div className="border-t border-[var(--arbo-border)]" />

            {/* Current selection summary */}
            <div className="px-3 py-2.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                <p className="text-[9px] arbo-text-muted mb-0.5">{t("editor.submitTab.selectedAction")}</p>
                <p className="text-xs font-semibold arbo-text">
                    {SUBMIT_ACTIONS.find((a) => a.value === (schema.onSubmit || FormFunctions.SaveToDB))?.label || "Save to Database"}
                </p>
            </div>
        </div>
    );
};
