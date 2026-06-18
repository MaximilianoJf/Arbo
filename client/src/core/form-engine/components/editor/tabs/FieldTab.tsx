import { Check, TrashBin, Xmark, Plus, BucketPaint, Persons } from "@gravity-ui/icons";
import { useTranslation } from "react-i18next";
import { getValidationLabels } from "../../../constants/editor-constants";
import { useEditorContext } from "../EditorContext";

export const FieldTab = () => {
    const { t } = useTranslation();
    const {
        schema, setSchema, activeField, availableValidations,
        selectedField, setSelectedField, removeField, setRightTab,
        toggleFieldValidation, pages, totalPages, moveFieldToPage,
        copiedFieldStyle, setCopiedFieldStyle, fieldStyleGlobal, setFieldStyleGlobal,
        styles,
        // Collaborators
        collaborators, newCollabEmail, setNewCollabEmail, newCollabRole, setNewCollabRole,
        collabError, setCollabError, handleAddCollaborator, handleRemoveCollaborator,
    } = useEditorContext();

    if (!activeField || activeField.name.startsWith("__page_break_")) {
        return (
            <div className="flex flex-col gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Persons className="size-4 arbo-text-accent" />
                        <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">{t("editor.field.share")}</label>
                    </div>
                    <div className="flex flex-col gap-2">
                        <input type="email" value={newCollabEmail} onChange={(e) => { setNewCollabEmail(e.target.value); setCollabError(null); }}
                            placeholder="Email" className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs focus:border-[var(--arbo-accent)] focus:outline-none transition-colors"
                            onKeyDown={(e) => e.key === "Enter" && handleAddCollaborator()} />
                        <div className="flex gap-1.5">
                            <select value={newCollabRole} onChange={(e) => setNewCollabRole(e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs focus:border-[var(--arbo-accent)] focus:outline-none">
                                <option value="viewer">{t("editor.field.viewer")}</option>
                                <option value="editor">{t("editor.field.editor_role")}</option>
                            </select>
                            <button onClick={handleAddCollaborator} disabled={!newCollabEmail.trim() || !schema.id} className="arbo-btn arbo-btn-primary text-xs py-1.5 px-3 disabled:opacity-40">{t("common.add")}</button>
                        </div>
                        {collabError && <p className="text-[10px] text-[var(--arbo-danger)]">{collabError}</p>}
                        {!schema.id && <p className="text-[10px] arbo-text-muted">{t("editor.field.saveFirst")}</p>}
                    </div>
                    {collaborators.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                            {collaborators.map((collab) => (
                                <div key={collab.email} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                                    <div className="size-5 rounded-full bg-[var(--arbo-accent-muted)] flex items-center justify-center text-[9px] font-bold arbo-text-accent shrink-0">{collab.email[0].toUpperCase()}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] arbo-text truncate">{collab.email}</p>
                                        <p className="text-[9px] arbo-text-muted capitalize">{collab.role}</p>
                                    </div>
                                    <button onClick={() => handleRemoveCollaborator(collab.email)} className="p-0.5 rounded text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] transition-colors shrink-0"><TrashBin className="size-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="border-t border-[var(--arbo-border)] pt-3">
                    <p className="text-xs arbo-text-muted text-center">{t("editor.field.selectField")}</p>
                </div>
            </div>
        );
    }

    const isCompanionField = activeField.name.endsWith("_confirm");

    return (
        <div className="flex flex-col gap-3">
            {/* Label */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.field.label")}</label>
                <input
                    className={`w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm focus:border-[var(--arbo-accent)] focus:outline-none transition-colors ${isCompanionField ? "opacity-60 cursor-not-allowed" : ""}`}
                    value={activeField.label || ""}
                    disabled={isCompanionField}
                    onChange={(e) => { const val = e.target.value; setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, label: val } : f) })); }}
                    title={isCompanionField ? "Confirm password field label is locked" : ""}
                />
            </div>

            {/* Placeholder */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.field.placeholder")}</label>
                <input className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm focus:border-[var(--arbo-accent)] focus:outline-none transition-colors"
                    value={activeField.placeholder || ""}
                    onChange={(e) => { const val = e.target.value; setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, placeholder: val } : f) })); }}
                />
            </div>

            {/* Type */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.field.type")}</label>
                <div className="px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-xs arbo-text-secondary">
                    {activeField.componentType.replace("Dynamic", "")} &middot; {activeField.type}
                </div>
            </div>

            {/* Required */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.field.required")}</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <span className="text-xs arbo-text">{t("common.required")}</span>
                    <button onClick={() => setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, required: !f.required } : f) }))}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${activeField.required ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}>
                        <div className={`size-4 rounded-full bg-white transition-transform ${activeField.required ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>

            {/* Validations */}
            {availableValidations.length > 0 && (
                <div>
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.field.validations")}</label>
                    <div className="flex flex-col gap-1">
                        {availableValidations.filter((v) => v !== "required").map((validation) => {
                            const isActive = validation === "confirmPassword"
                                ? schema.fields.some((f) => f.name === `${activeField.name}_confirm`)
                                : (activeField.validate || []).includes(validation);
                            return (
                                <button key={validation} onClick={() => toggleFieldValidation(activeField.name, validation)}
                                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${isActive ? "bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)] border border-[var(--arbo-accent)]/30" : "bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-secondary hover:border-[var(--arbo-border-light)]"}`}>
                                    <span>{getValidationLabels(t)[validation] || validation}</span>
                                    {isActive && <Check className="size-3" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Options (Checkbox / Select / Radio) */}
            {(activeField.componentType === "DynamicCheckbox" || activeField.componentType === "DynamicSelect" || activeField.componentType === "DynamicRadioGroup") && (
                <div>
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.field.options")}</label>
                    <div className="flex flex-col gap-1">
                        {(activeField.options || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <input className="flex-1 px-2 py-1 rounded bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs focus:border-[var(--arbo-accent)] focus:outline-none"
                                    value={opt}
                                    onChange={(e) => { const val = e.target.value; setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, options: (f.options || []).map((o, j) => j === i ? val : o) } : f) })); }}
                                />
                                <button onClick={() => setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, options: (f.options || []).filter((_, j) => j !== i) } : f) }))} className="p-1 text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] rounded"><Xmark className="size-3" /></button>
                            </div>
                        ))}
                        <button onClick={() => setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, options: [...(f.options || []), `Option ${(f.options || []).length + 1}`] } : f) }))}
                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs arbo-text-muted hover:text-[var(--arbo-accent)] hover:bg-[var(--arbo-accent-subtle)] transition-colors">
                            <Plus className="size-3" /> {t("editor.field.addOption")}
                        </button>
                    </div>
                </div>
            )}

            {/* Page selector */}
            {totalPages > 1 && (
                <div>
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">{t("editor.field.page")}</label>
                    <div className="flex gap-1">
                        {pages.map((pNum, idx) => (
                            <button key={pNum} onClick={() => moveFieldToPage(activeField.name, pNum)}
                                className={`size-7 rounded text-xs font-bold transition-colors ${(activeField.page ?? 0) === pNum ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted"}`}>{idx + 1}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* Field Styling */}
            <div className="border-t border-[var(--arbo-border)] pt-3">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">{t("editor.field.fieldStyle")}</label>
                    {!fieldStyleGlobal && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCopiedFieldStyle({ ...activeField.fieldStyles })}
                                className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-medium transition-colors bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-muted hover:border-[var(--arbo-accent)] hover:text-[var(--arbo-accent)]"
                                title={t("editor.field.copyFieldStyle")}
                            ><BucketPaint className="size-3" /> {t("common.copy")}</button>
                            {copiedFieldStyle && (
                                <button
                                    onClick={() => {
                                        setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, fieldStyles: { ...copiedFieldStyle } } : f) }));
                                        setCopiedFieldStyle(null);
                                    }}
                                    className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[9px] font-medium bg-[var(--arbo-accent-muted)] border border-[var(--arbo-accent)]/30 text-[var(--arbo-accent)]"
                                >{t("editor.field.paste")}</button>
                            )}
                        </div>
                    )}
                </div>

                {/* Global / Individual toggle */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-3 transition-colors ${fieldStyleGlobal ? "bg-[var(--arbo-accent-muted)] border-[var(--arbo-accent)]/30" : "bg-[var(--arbo-surface-2)] border-[var(--arbo-border)]"}`}>
                    <div>
                        <span className="text-xs arbo-text font-medium">{t("editor.field.allSame")}</span>
                        <p className="text-[9px] mt-0.5 transition-colors" style={{ color: fieldStyleGlobal ? "var(--arbo-accent)" : "var(--arbo-text-muted)" }}>
                            {fieldStyleGlobal ? t("editor.field.allFieldsAffected") : t("editor.field.onlyThisField")}
                        </p>
                    </div>
                    <button
                        onClick={() => setFieldStyleGlobal((v) => !v)}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${fieldStyleGlobal ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                    >
                        <div className={`size-4 rounded-full bg-white transition-transform ${fieldStyleGlobal ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>

                {/* Color pickers */}
                <FieldStylePickers
                    fs={fieldStyleGlobal ? (styles.globalFieldStyles || {}) : (activeField.fieldStyles || {})}
                    onUpdate={(patch) => {
                        if (fieldStyleGlobal) {
                            setSchema((prev) => ({
                                ...prev,
                                styles: { ...prev.styles, globalFieldStyles: { ...(prev.styles?.globalFieldStyles || {}), ...patch } },
                            }));
                        } else {
                            setSchema((prev) => ({
                                ...prev,
                                fields: prev.fields.map((f) =>
                                    f.name === activeField.name
                                        ? { ...f, fieldStyles: { ...f.fieldStyles, ...patch } }
                                        : f
                                ),
                            }));
                        }
                    }}
                />
            </div>

            <button onClick={() => { removeField(activeField.name); setSelectedField(null); }}
                className="arbo-btn arbo-btn-danger w-full mt-2 text-xs">
                <TrashBin className="size-3.5" /> {t("editor.field.deleteField")}
            </button>
        </div>
    );
};

// --- Field style color pickers ---
const FieldStylePickers = ({ fs, onUpdate }: {
    fs: Record<string, any>;
    onUpdate: (patch: Record<string, string | undefined>) => void;
}) => {
    const { t } = useTranslation();
    const row = (label: string, key: string, def: string) => (
        <div className="flex items-center justify-between">
            <span className="text-[10px] arbo-text-secondary">{label}</span>
            <div className="flex items-center gap-1.5">
                <input type="color" value={fs[key] || def}
                    onChange={(e) => onUpdate({ [key]: e.target.value })}
                    className="size-5 rounded cursor-pointer border border-[var(--arbo-border)]" />
                {fs[key] && <button onClick={() => onUpdate({ [key]: undefined })} className="text-[8px] arbo-text-muted hover:text-[var(--arbo-accent)]">x</button>}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-2.5">
            <label className="text-[9px] font-semibold arbo-text-secondary uppercase tracking-wider">{t("editor.formStyles.fieldColors.normal")}</label>
            {row(t("editor.formStyles.fieldColors.label"), "labelColor", "#e4e4ef")}
            {row(t("editor.formStyles.fieldColors.text"), "inputTextColor", "#e4e4ef")}
            {row(t("editor.formStyles.fieldColors.bg"), "inputBgColor", "#22222e")}
            {row(t("editor.formStyles.fieldColors.border"), "inputBorderColor", "#2e2e3e")}
            <div className="border-t border-[var(--arbo-border)] pt-2 mt-1" />
            <label className="text-[9px] font-semibold arbo-text-secondary uppercase tracking-wider">{t("editor.formStyles.fieldColors.hoverTitle")}</label>
            {row(t("editor.formStyles.fieldColors.label"), "labelColorHover", "#ffffff")}
            {row(t("editor.formStyles.fieldColors.text"), "inputTextColorHover", "#ffffff")}
            {row(t("editor.formStyles.fieldColors.bg"), "inputBgColorHover", "#2a2a38")}
            {row(t("editor.formStyles.fieldColors.border"), "inputBorderColorHover", "#3a3a4a")}
        </div>
    );
};
