import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Xmark, ChevronDown, ChevronUp, ArrowRotateLeft } from "@gravity-ui/icons";
import { STYLE_PRESETS, getShadowCss } from "../../../constants/style-presets";
import {
    PRESET_COLORS, PRESET_GRADIENTS,
    CONTACT_SIZES, DEFAULT_CONTACT_FIELDS,
    getAnimEntranceOptions, getAnimHoverOptions, getAnimFieldFocusOptions,
    getAnimEasingOptions, getAnimSpeedOptions,
} from "../../../constants/editor-constants";
import { getAccentStyle, getGlassStyle, getPageBgCss, isColorLight, getEntranceAnimClass, getEntranceAnimStyle, getHoverAnimClass, getTransitionSpeed, applyAlpha } from "../../../utils/style-helpers";
import type { FormStyles } from "../../../types";
import { useEditorContext } from "../EditorContext";

export const FormStylesTab = () => {
    // Contact settings moved to the Page tab — this tab now focuses on form styling.
    return (
        <div className="flex flex-col gap-4">
            <FormStylesContent />
        </div>
    );
};

// --- Form styles content (shown when "Formulario" is selected) ---
const FormStylesContent = () => {
    const { t } = useTranslation();
    const { styles, updateStyles, setRightTab, fieldStyleGlobal, setFieldStyleGlobal } = useEditorContext();

    return (
        <>
            {/* Presets — always visible */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-2">{t("editor.formStyles.presets")}</label>
                <div className="grid grid-cols-4 gap-1.5">
                    {STYLE_PRESETS.map((preset) => {
                        const isActive = styles.preset === preset.name;
                        return (
                            <button
                                key={preset.name}
                                onClick={() => updateStyles({ pageGlowEnabled: false, pageGlowOrbs: [], ...preset.styles, preset: preset.name })}
                                className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all group"
                                style={{
                                    border: `2px solid ${isActive ? preset.preview.accent : "transparent"}`,
                                    background: isActive ? `${preset.preview.accent}15` : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.border = `2px solid ${preset.preview.accent}55`;
                                        e.currentTarget.style.background = `${preset.preview.accent}10`;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.border = "2px solid transparent";
                                        e.currentTarget.style.background = "transparent";
                                    }
                                }}
                            >
                                <div className="w-full h-8 rounded-md overflow-hidden transition-transform group-hover:scale-105" style={{ background: preset.preview.pageBg, border: `1px solid ${preset.preview.border}` }}>
                                    <div className="mx-auto mt-1.5 w-[70%] h-4 rounded-sm" style={{ background: preset.preview.cardBg, border: `1px solid ${preset.preview.border}` }}>
                                        <div className="h-1 rounded-t-sm" style={{ background: preset.preview.accent }} />
                                    </div>
                                </div>
                                <span className="text-[9px] transition-colors" style={{ color: isActive ? preset.preview.accent : "var(--arbo-text-muted)" }}>{preset.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Card preview — always visible */}
            <CardPreview />

            {/* Colores y fondo */}
            <Collapsible title={t("editor.formStyles.colorsAndBg")} defaultOpen={false}>
                {/* Accent */}
                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1.5">{t("editor.formStyles.accentColor")}</label>
                    <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((color) => (
                            <button key={color} onClick={() => updateStyles({ accentColor: color, gradient: undefined })}
                                className={`size-7 rounded-lg transition-all ${styles.accentColor === color && !styles.gradient ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--arbo-surface)]" : "hover:scale-110"}`}
                                style={{ background: color }} />
                        ))}
                        <div className="relative">
                            <input type="color" value={styles.accentColor || "#4ADE80"} onChange={(e) => updateStyles({ accentColor: e.target.value, gradient: undefined })} className="absolute inset-0 opacity-0 cursor-pointer size-7" />
                            <div className="size-7 rounded-lg border-2 border-dashed border-[var(--arbo-border)] flex items-center justify-center arbo-text-muted text-xs">+</div>
                        </div>
                    </div>
                </div>

                {/* Gradient */}
                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1.5">{t("editor.formStyles.gradient")}</label>
                    <div className="flex flex-wrap gap-1.5">
                        {PRESET_GRADIENTS.map((grad) => (
                            <button key={grad} onClick={() => updateStyles({ gradient: grad, accentColor: undefined })}
                                className={`w-10 h-7 rounded-lg transition-all ${styles.gradient === grad ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--arbo-surface)]" : "hover:scale-110"}`}
                                style={{ background: grad }} />
                        ))}
                        <button onClick={() => updateStyles({ gradient: undefined })} className="w-10 h-7 rounded-lg border border-dashed border-[var(--arbo-border)] flex items-center justify-center arbo-text-muted text-[9px]">{t("common.none")}</button>
                    </div>
                </div>

                {/* Card BG */}
                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1.5">{t("editor.formStyles.cardBg")}</label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={styles.bgColor || "#1a1a24"} onChange={(e) => updateStyles({ bgColor: e.target.value })} className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
                        <span className="text-[9px] arbo-text-muted font-mono truncate">{styles.bgColor || "default"}</span>
                    </div>
                </div>

                {/* Border Color */}
                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1.5">{t("editor.formStyles.borderColor")}</label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={styles.borderColor || "#2e2e3e"} onChange={(e) => updateStyles({ borderColor: e.target.value })} className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
                        <span className="text-[9px] arbo-text-muted font-mono">{styles.borderColor || "default"}</span>
                        {styles.borderColor && <button onClick={() => updateStyles({ borderColor: undefined })} className="text-[9px] arbo-text-muted hover:text-[var(--arbo-accent)]">{t("common.reset")}</button>}
                    </div>
                </div>
            </Collapsible>

            {/* Efecto Glass */}
            <Collapsible title={t("editor.formStyles.glassEffect")} defaultOpen={false}>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] arbo-text-muted w-20 shrink-0">{t("editor.formStyles.transparency")}</span>
                    <input type="range" min="0" max="100" step="5" value={styles.cardOpacity ?? 100} onChange={(e) => updateStyles({ cardOpacity: Number(e.target.value) })} className="flex-1 accent-[var(--arbo-accent)]" />
                    <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.cardOpacity ?? 100}%</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] arbo-text-muted w-20 shrink-0">{t("editor.formStyles.blur")}</span>
                    <input type="range" min="0" max="20" step="1" value={styles.cardBlur ?? 0} onChange={(e) => updateStyles({ cardBlur: Number(e.target.value) })} className="flex-1 accent-[var(--arbo-accent)]" />
                    <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.cardBlur ?? 0}px</span>
                </div>
            </Collapsible>

            {/* Estilos de inputs */}
            <Collapsible title={t("editor.formStyles.inputStyles")} defaultOpen={false}>
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${fieldStyleGlobal ? "bg-[var(--arbo-accent-muted)] border-[var(--arbo-accent)]/30" : "bg-[var(--arbo-surface-2)] border-[var(--arbo-border)]"}`}>
                    <div>
                        <span className="text-xs arbo-text font-medium">{t("editor.formStyles.allSame")}</span>
                        <p className="text-[9px] mt-0.5 transition-colors" style={{ color: fieldStyleGlobal ? "var(--arbo-accent)" : "var(--arbo-text-muted)" }}>
                            {fieldStyleGlobal ? t("editor.formStyles.allFieldsAffected") : t("editor.formStyles.editPerField")}
                        </p>
                    </div>
                    <button
                        onClick={() => setFieldStyleGlobal((v) => !v)}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${fieldStyleGlobal ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                    >
                        <div className={`size-4 rounded-full bg-white transition-transform ${fieldStyleGlobal ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>

                {fieldStyleGlobal ? (
                    <GlobalFieldStylePickers />
                ) : (
                    <div className="px-3 py-3 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] flex flex-col gap-1.5">
                        <p className="text-[10px] arbo-text-muted leading-relaxed">{t("editor.formStyles.editPerField")}. <span className="font-semibold arbo-text">{t("editor.formStyles.fieldTab")}</span></p>
                        <button onClick={() => setRightTab("field")} className="text-[10px] text-[var(--arbo-accent)] hover:underline text-left">{t("editor.formStyles.goToField")}</button>
                    </div>
                )}
            </Collapsible>

            {/* Animaciones */}
            <Collapsible title={t("editor.formStyles.animations")} defaultOpen={false}>
                <AnimationSection />
            </Collapsible>
        </>
    );
};

// --- Card preview miniature (with live animation preview) ---
const CardPreview = () => {
    const { styles, animReplayKey } = useEditorContext();

    const hasGlass = (styles.cardOpacity ?? 100) < 100 || (styles.cardBlur ?? 0) > 0;
    const accent = styles.accentColor || "#4ADE80";
    const glowBg = getPageBgCss(styles);
    const previewBg = hasGlass && !styles.pageGlowEnabled
        ? `radial-gradient(ellipse at 20% 55%, ${accent}66 0%, transparent 65%), radial-gradient(ellipse at 80% 20%, #8B5CF666 0%, transparent 60%), ${glowBg}`
        : glowBg;

    // Animation classes
    const entranceClass = getEntranceAnimClass(styles);
    const hoverClass = getHoverAnimClass(styles);
    const transitionSpeed = getTransitionSpeed(styles);
    const accentColor = styles.accentColor || "#4ADE80";
    const glowColor = applyAlpha(accentColor, 0.35);

    const animVars = {
        "--arbo-transition-speed": transitionSpeed,
        "--arbo-hover-glow-color": glowColor,
        "--arbo-focus-color": applyAlpha(accentColor, 0.3),
    } as React.CSSProperties;

    const cardStyle = {
        ...getGlassStyle(styles.bgColor || "#1a1a24", styles),
        borderRadius: `${styles.borderRadius ?? 14}px`,
        border: `1px solid ${styles.borderColor || "var(--arbo-border)"}`,
        boxShadow: getShadowCss(styles.shadowStyle, styles.accentColor, styles.gradient),
    };

    return (
        <div className="rounded-lg overflow-hidden border border-[var(--arbo-border)] p-3" style={{ ...animVars, background: previewBg }}>
            {/* key forces remount → replays entrance animation */}
            <div key={animReplayKey}
                className={`overflow-hidden ${entranceClass} ${hoverClass}`.trim()}
                style={{ ...cardStyle, ...getEntranceAnimStyle(styles, 0) }}>
                <div className="h-2" style={getAccentStyle(styles)} />
                <div className="p-3 flex flex-col gap-1.5">
                    <div className="h-2 w-2/3 rounded" style={{ background: "rgba(255,255,255,0.15)" }} />
                    <div className="h-1.5 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
                    <div className="h-6 rounded mt-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div className="h-6 rounded" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div className="flex justify-end mt-1">
                        <div className="h-5 w-14 rounded" style={getAccentStyle(styles)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Animation section (rendered inside a Collapsible) ---
const AnimationSection = () => {
    const { t } = useTranslation();
    const { styles, updateStyles, replayAnimations } = useEditorContext();

    /** Update + replay: every animation change triggers a visual preview */
    const updateAnim = (patch: Partial<FormStyles>) => {
        updateStyles(patch);
        // Small delay so React renders the new style before remounting
        setTimeout(replayAnimations, 30);
    };

    const selectRow = (label: string, value: string | undefined, options: readonly { value: string; label: string }[], onChange: (v: string) => void) => (
        <div className="flex items-center gap-2">
            <span className="text-[10px] arbo-text-muted w-24 shrink-0">{label}</span>
            <select
                value={value || options[0].value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] rounded-lg text-xs arbo-text px-2 py-1.5 outline-none focus:border-[var(--arbo-accent)]"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="flex flex-col gap-2.5">
            {/* Replay button */}
            <button
                onClick={replayAnimations}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[10px] font-medium transition-colors bg-[var(--arbo-surface-2)] arbo-text-muted hover:text-[var(--arbo-accent)] hover:bg-[var(--arbo-accent-muted)] border border-[var(--arbo-border)]"
            >
                <ArrowRotateLeft className="size-3" /> {t("editor.formStyles.replayAnimations")}
            </button>

            {selectRow(t("editor.formStyles.entrance"), styles.animEntrance, getAnimEntranceOptions(t), (v) => updateAnim({ animEntrance: v as any }))}

            {(styles.animEntrance && styles.animEntrance !== "none") && (
                <>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] arbo-text-muted w-24 shrink-0">{t("editor.formStyles.duration")}</span>
                        <input type="range" min="200" max="1500" step="50"
                            value={styles.animEntranceDuration ?? 500}
                            onChange={(e) => updateAnim({ animEntranceDuration: Number(e.target.value) })}
                            className="flex-1 accent-[var(--arbo-accent)]" />
                        <span className="text-[10px] arbo-text-muted font-mono w-10 text-right">{styles.animEntranceDuration ?? 500}ms</span>
                    </div>

                    {selectRow(t("editor.formStyles.easing"), styles.animEntranceEasing, getAnimEasingOptions(t), (v) => updateAnim({ animEntranceEasing: v as any }))}

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] arbo-text-muted w-24 shrink-0">{t("editor.formStyles.stagger")}</span>
                        <button
                            onClick={() => updateAnim({ animEntranceStagger: !(styles.animEntranceStagger ?? false) })}
                            className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${styles.animEntranceStagger ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                        >
                            <div className={`size-4 rounded-full bg-white transition-transform ${styles.animEntranceStagger ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                        <span className="text-[9px] arbo-text-muted">{styles.animEntranceStagger ? t("editor.formStyles.staggerOn") : t("editor.formStyles.staggerOff")}</span>
                    </div>
                </>
            )}

            <div className="border-t border-[var(--arbo-border)] my-0.5" />

            {selectRow(t("editor.formStyles.hover"), styles.animHover, getAnimHoverOptions(t), (v) => updateAnim({ animHover: v as any }))}
            {selectRow(t("editor.formStyles.fieldFocus"), styles.animFieldFocus, getAnimFieldFocusOptions(t), (v) => updateAnim({ animFieldFocus: v as any }))}

            <div className="border-t border-[var(--arbo-border)] my-0.5" />

            <div className="flex items-center gap-2">
                <span className="text-[10px] arbo-text-muted w-24 shrink-0">{t("editor.formStyles.speed")}</span>
                <div className="flex gap-1 flex-1">
                    {getAnimSpeedOptions(t).map((opt) => (
                        <button key={opt.value}
                            onClick={() => updateAnim({ animTransitionSpeed: opt.value as any })}
                            className={`flex-1 text-[10px] py-1 rounded-md transition-colors ${
                                (styles.animTransitionSpeed || "normal") === opt.value
                                    ? "bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)] font-medium"
                                    : "bg-[var(--arbo-surface-2)] arbo-text-muted hover:arbo-text-secondary"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Reusable collapsible section ---
const Collapsible = ({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl overflow-hidden border border-[var(--arbo-border)]">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-left transition-colors hover:bg-[var(--arbo-surface-3)]"
                style={{ background: "var(--arbo-surface-2)" }}
            >
                <span className="text-[10px] font-bold arbo-text uppercase tracking-wider">{title}</span>
                {open ? <ChevronUp className="size-3 arbo-text-muted" /> : <ChevronDown className="size-3 arbo-text-muted" />}
            </button>
            {open && <div className="p-3 flex flex-col gap-3" style={{ background: "var(--arbo-surface)" }}>{children}</div>}
        </div>
    );
};

// --- Contact panel settings with live preview (rendered in the Page tab) ---
export const ContactPanelSettings = () => {
    const { t } = useTranslation();
    const { styles, updateStyles } = useEditorContext();
    const gridOn = !!styles.pageLayout?.enabled;   // free grid governs position & size
    const contactEnabled = styles.contactEnabled ?? true;
    const contactFields = styles.contactFields || DEFAULT_CONTACT_FIELDS;
    const enabledFields = contactFields.filter((cf) => cf.enabled);

    // Derive colors from the form's card styles (auto-inherit)
    const cardBg = styles.bgColor || "#1a1a24";
    const light = isColorLight(cardBg);
    const titleColor = light ? "#1e293b" : "#e2e8f0";
    const subColor = light ? "#64748b" : "#94a3b8";
    const accentBg = styles.gradient
        ? { background: styles.gradient }
        : { background: styles.accentColor || "#4ADE80" };

    return (
        <div className="flex flex-col gap-3">
            {/* Toggle — always visible */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                <span className="text-xs arbo-text font-medium">{t("editor.formStyles.showContact")}</span>
                <button onClick={() => updateStyles({ contactEnabled: !contactEnabled })}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${contactEnabled ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}>
                    <div className={`size-4 rounded-full bg-white transition-transform ${contactEnabled ? "translate-x-4" : "translate-x-0"}`} />
                </button>
            </div>

            {contactEnabled && (
                <>
                    {/* Live mini preview — always visible */}
                    <div className="rounded-lg overflow-hidden border border-[var(--arbo-border)]"
                        style={{
                            ...getGlassStyle(cardBg, styles),
                            borderRadius: `${styles.borderRadius ?? 14}px`,
                            boxShadow: getShadowCss(styles.shadowStyle, styles.accentColor, styles.gradient),
                        }}>
                        <div className="h-1.5" style={accentBg} />
                        <div className="p-3">
                            <p className="text-[10px] font-semibold mb-0.5" style={{ color: titleColor }}>
                                {styles.contactTitle || t("editor.formStyles.titlePlaceholder")}
                            </p>
                            <p className="text-[8px] mb-2" style={{ color: subColor }}>
                                {styles.contactSubtitle || t("editor.formStyles.subtitlePlaceholder")}
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {enabledFields.slice(0, 3).map((cf) => (
                                    <div key={cf.id} className="h-5 rounded px-2 flex items-center"
                                        style={{ background: light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)", border: `1px solid ${light ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)"}` }}>
                                        <span className="text-[8px]" style={{ color: subColor }}>{cf.label}</span>
                                    </div>
                                ))}
                                {enabledFields.length > 3 && (
                                    <span className="text-[8px] text-center" style={{ color: subColor }}>+{enabledFields.length - 3} {t("editor.formStyles.more")}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Disposicion — managed by the free grid when enabled */}
                    {!gridOn && (
                        <Collapsible title={t("editor.formStyles.layout")} defaultOpen={true}>
                            {/* Position */}
                            <div>
                                <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.formStyles.position")}</label>
                                <div className="grid grid-cols-2 gap-1">
                                    {(["left", "right"] as const).map((pos) => (
                                        <button key={pos} onClick={() => updateStyles({ contactPosition: pos })}
                                            className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${(styles.contactPosition || "left") === pos ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                            {pos === "left" ? t("editor.formStyles.left") : t("editor.formStyles.right")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Size */}
                            <div>
                                <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.formStyles.size")}</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {CONTACT_SIZES.map((size) => (
                                        <button key={size.value} onClick={() => updateStyles({ contactSize: size.value as any })}
                                            className={`px-1 py-1.5 rounded-md text-[9px] font-medium transition-colors ${(styles.contactSize || "md") === size.value ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>{size.label}</button>
                                    ))}
                                </div>
                            </div>
                        </Collapsible>
                    )}

                    {/* Textos del panel */}
                    <Collapsible title={t("editor.formStyles.panelTexts")} defaultOpen={false}>
                        <div>
                            <label className="text-[9px] arbo-text-muted block mb-1">{t("editor.formStyles.titleLabel")}</label>
                            <input
                                className="w-full px-2 py-1.5 rounded-md bg-[var(--arbo-surface-2)] arbo-text text-[11px] border border-[var(--arbo-border)] focus:border-[var(--arbo-accent)] focus:outline-none"
                                value={styles.contactTitle ?? ""}
                                onChange={(e) => updateStyles({ contactTitle: e.target.value })}
                                placeholder={t("editor.formStyles.titlePlaceholder")}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] arbo-text-muted block mb-1">{t("editor.formStyles.subtitleLabel")}</label>
                            <input
                                className="w-full px-2 py-1.5 rounded-md bg-[var(--arbo-surface-2)] arbo-text text-[11px] border border-[var(--arbo-border)] focus:border-[var(--arbo-accent)] focus:outline-none"
                                value={styles.contactSubtitle ?? ""}
                                onChange={(e) => updateStyles({ contactSubtitle: e.target.value })}
                                placeholder={t("editor.formStyles.subtitlePlaceholder")}
                            />
                        </div>
                    </Collapsible>

                    {/* Campos del contacto */}
                    <Collapsible title={t("editor.formStyles.contactFields")} defaultOpen={true}>
                        <div className="flex flex-col gap-1.5">
                            {contactFields.map((cf, i) => (
                                <div key={cf.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                                    <button onClick={() => {
                                        const fields = [...contactFields];
                                        fields[i] = { ...fields[i], enabled: !fields[i].enabled };
                                        updateStyles({ contactFields: fields });
                                    }}
                                        className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${cf.enabled ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}>
                                        <div className={`size-3 rounded-full bg-white transition-transform ${cf.enabled ? "translate-x-3" : "translate-x-0"}`} />
                                    </button>
                                    <input className="flex-1 px-1.5 py-0.5 rounded bg-transparent arbo-text text-[11px] focus:bg-[var(--arbo-surface-3)] focus:outline-none min-w-0"
                                        value={cf.label}
                                        onChange={(e) => {
                                            const fields = [...contactFields];
                                            fields[i] = { ...fields[i], label: e.target.value };
                                            updateStyles({ contactFields: fields });
                                        }}
                                    />
                                    <select
                                        value={cf.type}
                                        onChange={(e) => {
                                            const fields = [...contactFields];
                                            fields[i] = { ...fields[i], type: e.target.value };
                                            updateStyles({ contactFields: fields });
                                        }}
                                        className="text-[9px] arbo-text-muted bg-transparent shrink-0 cursor-pointer focus:outline-none"
                                    >
                                        <option value="text">text</option>
                                        <option value="email">email</option>
                                        <option value="tel">tel</option>
                                        <option value="url">url</option>
                                        <option value="number">number</option>
                                    </select>
                                    {i >= 2 && (
                                        <button onClick={() => {
                                            updateStyles({ contactFields: contactFields.filter((_, j) => j !== i) });
                                        }} className="p-0.5 text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] rounded shrink-0">
                                            <Xmark className="size-2.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => {
                                const fields = [...contactFields];
                                fields.push({ id: crypto.randomUUID(), name: `custom_${Date.now()}`, label: "Nuevo campo", type: "text", placeholder: "", required: false, enabled: true });
                                updateStyles({ contactFields: fields });
                            }}
                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs arbo-text-muted hover:text-[var(--arbo-accent)] hover:bg-[var(--arbo-accent-subtle)] transition-colors">
                                <Plus className="size-3" /> {t("editor.formStyles.addContactField")}
                            </button>
                        </div>
                    </Collapsible>
                </>
            )}
        </div>
    );
};

// --- Global field style pickers ---
const GlobalFieldStylePickers = () => {
    const { t } = useTranslation();
    const { styles, updateStyles } = useEditorContext();
    const gfs = styles.globalFieldStyles || {};

    const updateGlobal = (patch: Record<string, string | undefined>) => {
        updateStyles({ globalFieldStyles: { ...gfs, ...patch } });
    };

    const row = (label: string, key: string, def: string) => (
        <div className="flex items-center justify-between">
            <span className="text-[10px] arbo-text-secondary">{label}</span>
            <div className="flex items-center gap-1.5">
                <input type="color" value={(gfs as any)[key] || def} onChange={(e) => updateGlobal({ [key]: e.target.value })} className="size-5 rounded cursor-pointer border border-[var(--arbo-border)]" />
                {(gfs as any)[key] && <button onClick={() => updateGlobal({ [key]: undefined })} className="text-[8px] arbo-text-muted hover:text-[var(--arbo-accent)]">x</button>}
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
            {(gfs.labelColor || gfs.inputBgColor || gfs.inputTextColor || gfs.inputBorderColor || gfs.labelColorHover || gfs.inputBgColorHover || gfs.inputTextColorHover || gfs.inputBorderColorHover) && (
                <button onClick={() => updateStyles({ globalFieldStyles: undefined })} className="text-[9px] arbo-text-muted hover:text-[var(--arbo-danger)] mt-1">
                    {t("editor.formStyles.fieldColors.clearGlobal")}
                </button>
            )}
        </div>
    );
};
