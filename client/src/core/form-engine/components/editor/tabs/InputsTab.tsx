import { Plus, Gear } from "@gravity-ui/icons";
import { useTranslation } from "react-i18next";
import { getInputPalette } from "../../../constants/editor-constants";
import { ModalWrapper } from "../../forms";
import { FieldSettingsForm } from "../../forms";
import { useEditorContext } from "../EditorContext";
import { BlockLibrary } from "../BlockLibrary";

export const InputsTab = () => {
    const { t } = useTranslation();
    const { quickAddField } = useEditorContext();
    const INPUT_PALETTE = getInputPalette(t);

    return (
        <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider mb-1">{t("editor.inputs.clickToAdd")}</p>
            {INPUT_PALETTE.map((item) => (
                <button
                    key={`${item.componentType}-${item.type}`}
                    onClick={() => quickAddField(item)}
                    className="flex items-center gap-2.5 w-full p-2.5 rounded-lg transition-all text-left group"
                    style={{ background: "var(--arbo-surface-2)", border: "1px solid var(--arbo-border)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--arbo-accent)"; e.currentTarget.style.background = "var(--arbo-accent-subtle)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--arbo-border)"; e.currentTarget.style.background = "var(--arbo-surface-2)"; }}
                >
                    <span className="flex items-center justify-center size-8 rounded-lg text-sm font-mono shrink-0" style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-accent)" }}>{item.icon}</span>
                    <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium arbo-text block">{item.label}</span>
                        <span className="text-[10px] arbo-text-muted">{item.description}</span>
                    </div>
                    <Plus className="size-3.5 arbo-text-muted group-hover:text-[var(--arbo-accent)] transition-colors shrink-0" />
                </button>
            ))}
            <div className="mt-2 pt-2 border-t border-[var(--arbo-border)]">
                <ModalWrapper content={<FieldSettingsForm />}>
                    <button className="arbo-btn arbo-btn-secondary w-full text-xs"><Gear className="size-3.5" /> {t("editor.inputs.advancedAdd")}</button>
                </ModalWrapper>
            </div>

            {/* Composite component library (per-user, shareable) */}
            <BlockLibrary />
        </div>
    );
};
