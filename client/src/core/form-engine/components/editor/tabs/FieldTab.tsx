import { useState } from "react";
import { Check, TrashBin, Xmark, Plus, BucketPaint, Persons, ArrowRotateRight } from "@gravity-ui/icons";
import { useTranslation } from "react-i18next";
import { getValidationLabels } from "../../../constants/editor-constants";
import { SPAN_PRESETS, getFieldSpan, spanKeyForBp } from "../../../utils/field-grid";
import type { FieldOptionsSource, PageBreakpoint } from "../../../types";
import { useEditorContext } from "../EditorContext";
import { useRemoteOptions } from "../../../hooks/useRemoteOptions";

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

            {/* Field width (grid mode) */}
            {styles.fieldGridEnabled && (
                <div>
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1.5">Ancho del campo</label>
                    <div className="flex flex-col gap-1.5">
                        {([
                            { key: "desktop", label: "PC" },
                            { key: "tablet", label: "Tablet" },
                            { key: "mobile", label: "Móvil" },
                        ] as { key: PageBreakpoint; label: string }[]).map((bp) => (
                            <div key={bp.key} className="flex items-center gap-1.5">
                                <span className="text-[9px] arbo-text-muted w-10 shrink-0">{bp.label}</span>
                                <div className="flex gap-1 flex-1">
                                    {SPAN_PRESETS.map((p) => {
                                        const isActive = getFieldSpan(activeField, bp.key) === p.cols;
                                        return (
                                            <button key={p.cols}
                                                onClick={() => {
                                                    const key = spanKeyForBp(bp.key);
                                                    setSchema((prev) => ({
                                                        ...prev,
                                                        fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, [key]: p.cols } : f),
                                                    }));
                                                }}
                                                className={`flex-1 px-1 py-1 rounded text-[9px] font-medium transition-colors ${
                                                    isActive
                                                        ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]"
                                                        : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)] hover:arbo-text"
                                                }`}>
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

            {/* Custom regex validation (text-like fields) */}
            {["DynamicTextField", "DynamicTextArea", "DynamicPasswordWithToggle", "DynamicNumberField"].includes(activeField.componentType) && (
                <div>
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1">Validación Regex personalizada</label>
                    <div className="flex flex-col gap-1.5">
                        <input
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs font-mono focus:border-[var(--arbo-accent)] focus:outline-none"
                            placeholder="Ej: ^[A-Z]{3}-\d{4}$"
                            value={activeField.pattern || ""}
                            onChange={(e) => { const val = e.target.value; setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, pattern: val || undefined } : f) })); }}
                        />
                        {activeField.pattern && (() => {
                            try { new RegExp(activeField.pattern); return null; }
                            catch { return <p className="text-[10px] text-[var(--arbo-danger)]">Expresión regular inválida — se ignora hasta corregirla.</p>; }
                        })()}
                        {activeField.pattern && (
                            <input
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs focus:border-[var(--arbo-accent)] focus:outline-none"
                                placeholder="Mensaje de error (ej: Debe tener formato ABC-1234)"
                                value={activeField.patternMessage || ""}
                                onChange={(e) => { const val = e.target.value; setSchema((prev) => ({ ...prev, fields: prev.fields.map((f) => f.name === activeField.name ? { ...f, patternMessage: val || undefined } : f) })); }}
                            />
                        )}
                        <p className="text-[9px] arbo-text-muted">Se aplica además de las validaciones de arriba. Sin barras: escribí el patrón directo.</p>
                    </div>
                </div>
            )}

            {/* Accepted file types (FileUpload) */}
            {activeField.componentType === "DynamicFileUpload" && (
                <div>
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1.5">Tipos de archivo aceptados</label>
                    <div className="flex flex-wrap gap-1">
                        {[
                            { label: "Imágenes", value: "image/*" },
                            { label: "PDF", value: ".pdf" },
                            { label: "Word", value: ".doc,.docx" },
                            { label: "Excel", value: ".xls,.xlsx" },
                            { label: "CSV", value: ".csv" },
                            { label: "Texto", value: ".txt" },
                            { label: "ZIP/RAR", value: ".zip,.rar" },
                            { label: "Audio", value: "audio/*" },
                            { label: "Video", value: "video/*" },
                        ].map((ft) => {
                            const parts = ft.value.split(",");
                            const isActive = parts.every((p) => (activeField.accept || []).includes(p));
                            return (
                                <button key={ft.value}
                                    onClick={() => setSchema((prev) => ({
                                        ...prev,
                                        fields: prev.fields.map((f) => {
                                            if (f.name !== activeField.name) return f;
                                            const current = f.accept || [];
                                            const next = isActive
                                                ? current.filter((a) => !parts.includes(a))
                                                : [...current, ...parts.filter((p) => !current.includes(p))];
                                            return { ...f, accept: next };
                                        }),
                                    }))}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                                        isActive
                                            ? "bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)] border border-[var(--arbo-accent)]/30"
                                            : "bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-muted hover:arbo-text"
                                    }`}>
                                    {ft.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[9px] arbo-text-muted mt-1.5">
                        {(activeField.accept || []).length === 0
                            ? "Sin restricción: acepta cualquier archivo."
                            : `Acepta: ${(activeField.accept || []).join(", ")}`}
                    </p>
                </div>
            )}

            {/* Options (Checkbox / Select / Radio / MultiSelect) */}
            {(activeField.componentType === "DynamicCheckbox" || activeField.componentType === "DynamicSelect" || activeField.componentType === "DynamicRadioGroup" || activeField.componentType === "DynamicMultiSelect") && (
                <OptionsSection
                    activeFieldName={activeField.name}
                    options={activeField.options || []}
                    optionsSource={activeField.optionsSource}
                    setSchema={setSchema}
                    t={t}
                />
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
                            // Strip the edited keys from every field's individual styles —
                            // otherwise per-field values override the global and don't sync.
                            const patchKeys = Object.keys(patch);
                            setSchema((prev) => ({
                                ...prev,
                                styles: { ...prev.styles, globalFieldStyles: { ...(prev.styles?.globalFieldStyles || {}), ...patch } },
                                fields: prev.fields.map((f) => {
                                    if (!f.fieldStyles) return f;
                                    const fs: Record<string, any> = { ...f.fieldStyles };
                                    patchKeys.forEach((k) => delete fs[k]);
                                    return { ...f, fieldStyles: fs };
                                }),
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

// ---------------------------------------------------------------------------
// Options section: static list + optional API source
// ---------------------------------------------------------------------------
interface OptionsSectionProps {
    activeFieldName: string;
    options: string[];
    optionsSource?: FieldOptionsSource;
    setSchema: (updater: (prev: any) => any) => void;
    t: (key: string) => string;
}

const OptionsSection = ({ activeFieldName, options, optionsSource, setSchema, t }: OptionsSectionProps) => {
    const hasSource = !!optionsSource?.url;
    const [previewOpen, setPreviewOpen] = useState(false);
    const [draftSource, setDraftSource] = useState<FieldOptionsSource>(
        optionsSource ?? { url: "", valueKey: "id", labelKey: "name", dataPath: "" }
    );

    const { items: previewItems, loading: previewLoading, error: previewError } = useRemoteOptions(
        previewOpen ? draftSource : undefined
    );

    const patchField = (patch: Partial<{ options: string[]; optionsSource: FieldOptionsSource | undefined }>) =>
        setSchema((prev: any) => ({
            ...prev,
            fields: prev.fields.map((f: any) =>
                f.name === activeFieldName ? { ...f, ...patch } : f
            ),
        }));

    const saveSource = () => patchField({ optionsSource: draftSource.url ? draftSource : undefined });
    const clearSource = () => {
        setDraftSource({ url: "", valueKey: "id", labelKey: "name", dataPath: "" });
        patchField({ optionsSource: undefined });
    };

    const inputCls = "flex-1 px-2 py-1 rounded bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs focus:border-[var(--arbo-accent)] focus:outline-none";

    return (
        <div className="flex flex-col gap-2">
            {/* Header with API toggle */}
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">{t("editor.field.options")}</label>
                <button
                    onClick={() => setPreviewOpen((v) => !v)}
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded transition-colors ${hasSource || previewOpen ? "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]" : "arbo-text-muted hover:text-[var(--arbo-accent)]"}`}
                >
                    {hasSource ? "⚡ Desde API" : "⚡ Conectar API"}
                </button>
            </div>

            {/* API source panel */}
            {previewOpen && (
                <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-accent)]/30">
                    <p className="text-[9px] arbo-text-muted font-semibold uppercase tracking-wider">Fuente de datos API</p>

                    <input
                        className={inputCls}
                        placeholder="URL del endpoint (ej: https://api.ejemplo.com/paises)"
                        value={draftSource.url}
                        onChange={(e) => setDraftSource((d) => ({ ...d, url: e.target.value }))}
                    />

                    <div className="flex gap-1">
                        <div className="flex-1">
                            <p className="text-[9px] arbo-text-muted mb-0.5">Campo valor <span className="opacity-60">(se guarda)</span></p>
                            <input
                                className={inputCls + " w-full"}
                                placeholder='ej: "id"'
                                value={draftSource.valueKey}
                                onChange={(e) => setDraftSource((d) => ({ ...d, valueKey: e.target.value }))}
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-[9px] arbo-text-muted mb-0.5">Campo visible <span className="opacity-60">(se muestra)</span></p>
                            <input
                                className={inputCls + " w-full"}
                                placeholder='ej: "nombre"'
                                value={draftSource.labelKey}
                                onChange={(e) => setDraftSource((d) => ({ ...d, labelKey: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div>
                        <p className="text-[9px] arbo-text-muted mb-0.5">Ruta al array <span className="opacity-60">(opcional, ej: "data" o "results.items")</span></p>
                        <input
                            className={inputCls + " w-full"}
                            placeholder='vacío si la respuesta ES el array'
                            value={draftSource.dataPath ?? ""}
                            onChange={(e) => setDraftSource((d) => ({ ...d, dataPath: e.target.value }))}
                        />
                    </div>

                    {/* Preview */}
                    {previewItems && (
                        <div className="rounded-md p-1.5 text-[9px] font-mono max-h-28 overflow-auto" style={{ background: "var(--arbo-surface-3)" }}>
                            {previewItems.slice(0, 8).map((i) => (
                                <div key={i.value} className="arbo-text-muted"><span className="arbo-text">{i.label}</span> → <span className="text-[var(--arbo-accent)]">{i.value}</span></div>
                            ))}
                            {previewItems.length > 8 && <div className="arbo-text-muted">…y {previewItems.length - 8} más</div>}
                        </div>
                    )}
                    {previewLoading && <p className="text-[9px] arbo-text-muted">Cargando preview…</p>}
                    {previewError && <p className="text-[9px] text-[var(--arbo-danger)]">{previewError}</p>}

                    <div className="flex gap-1 pt-0.5">
                        <button
                            onClick={saveSource}
                            disabled={!draftSource.url || !draftSource.valueKey || !draftSource.labelKey}
                            className="flex-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-[var(--arbo-accent)] text-[var(--arbo-bg)] disabled:opacity-40 transition-opacity"
                        >
                            Guardar fuente
                        </button>
                        <button
                            onClick={() => setPreviewOpen(false)}
                            className="px-2 py-1 rounded-md text-[10px] arbo-text-muted bg-[var(--arbo-surface-3)]"
                        >
                            <ArrowRotateRight className="size-3 inline mr-0.5" /> Preview
                        </button>
                        {hasSource && (
                            <button onClick={clearSource} className="px-2 py-1 rounded-md text-[10px] text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)]">
                                Quitar
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Static options (hidden when API source active) */}
            {!hasSource && !previewOpen && (
                <div className="flex flex-col gap-1">
                    {options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-1">
                            <input
                                className={inputCls}
                                value={opt}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    patchField({ options: options.map((o, j) => j === i ? val : o) });
                                }}
                            />
                            <button
                                onClick={() => patchField({ options: options.filter((_, j) => j !== i) })}
                                className="p-1 text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] rounded"
                            >
                                <Xmark className="size-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => patchField({ options: [...options, `Opción ${options.length + 1}`] })}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs arbo-text-muted hover:text-[var(--arbo-accent)] hover:bg-[var(--arbo-accent-subtle)] transition-colors"
                    >
                        <Plus className="size-3" /> {t("editor.field.addOption")}
                    </button>
                </div>
            )}

            {hasSource && !previewOpen && (
                <p className="text-[10px] arbo-text-muted px-1">
                    ⚡ Las opciones se cargan desde <span className="arbo-text font-mono break-all">{optionsSource!.url}</span>
                    {" · "}<button onClick={() => setPreviewOpen(true)} className="text-[var(--arbo-accent)] hover:underline">Editar</button>
                </p>
            )}
        </div>
    );
};
