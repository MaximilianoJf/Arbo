import { useTranslation } from "react-i18next";
import { getGlassStyle, getAccentStyle, getCardMaxWidth, getEmbedBgCss } from "../../utils/style-helpers";
import { getShadowCss } from "../../constants/style-presets";
import { DEFAULT_CONTACT_FIELDS, CONTACT_SIZES } from "../../constants/editor-constants";
import { useEditorContext } from "./EditorContext";

export const EmbedPreviewCanvas = () => {
    const {
        schema, styles,
        cardTitleColor, cardSubColor,
        previewWidth, setPreviewWidth,
        embedContainerRef, embedContainerActualWidth,
        startResize, renderViewFields,
        updateStyles,
    } = useEditorContext();

    return (
        <div className="flex-1 flex flex-col min-h-0 gap-0 rounded-xl overflow-hidden border border-[var(--arbo-border)]">
            {/* Simulated browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-b border-[var(--arbo-border)]" style={{ background: "var(--arbo-surface-3)" }}>
                <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="size-2.5 rounded-full bg-[#febc2e]" />
                    <div className="size-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 h-6 rounded-md flex items-center px-3 mx-4" style={{ background: "var(--arbo-surface-2)", border: "1px solid var(--arbo-border)" }}>
                    <span className="text-[10px] arbo-text-muted font-mono truncate">mi-sitio.com/landing</span>
                </div>
            </div>

            {/* Quick color bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 border-b border-[var(--arbo-border)]" style={{ background: "var(--arbo-surface-3)" }}>
                <span className="text-[9px] font-semibold arbo-text-muted uppercase tracking-wider shrink-0">Colores</span>
                {([
                    { label: "Fondo", value: styles.pageBgColor || "#0f0f14", key: "pageBgColor" },
                    { label: "Tarjeta", value: styles.bgColor || "#1a1a24", key: "bgColor" },
                ] as const).map(({ label, value, key }) => (
                    <label key={key} className="relative flex items-center gap-1 cursor-pointer rounded px-1.5 py-0.5 hover:bg-[var(--arbo-surface-2)] transition-colors">
                        <div className="size-3 rounded-full border border-[var(--arbo-border)]" style={{ background: value }} />
                        <span className="text-[9px] arbo-text-muted">{label}</span>
                        <input type="color" value={value} onChange={(e) => updateStyles({ [key]: e.target.value } as any)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </label>
                ))}
                <label className="relative flex items-center gap-1 cursor-pointer rounded px-1.5 py-0.5 hover:bg-[var(--arbo-surface-2)] transition-colors">
                    <div className="size-3 rounded-full" style={getAccentStyle(styles)} />
                    <span className="text-[9px] arbo-text-muted">Acento</span>
                    <input type="color" value={styles.accentColor || "#4ADE80"} onChange={(e) => updateStyles({ accentColor: e.target.value, gradient: undefined })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </label>

                {/* Quick embed glow orb dots */}
                {(styles.embedGlowEnabled && styles.embedGlowOrbs?.length) ? (
                    <div className="flex items-center gap-1 ml-1">
                        {styles.embedGlowOrbs.map((orb) => (
                            <label key={orb.id} className="relative cursor-pointer" title={`Luz ${orb.color}`}>
                                <div className="size-3 rounded-full" style={{ background: orb.color, boxShadow: `0 0 4px ${orb.color}` }} />
                                <input type="color" value={orb.color}
                                    onChange={(e) => updateStyles({
                                        embedGlowOrbs: (styles.embedGlowOrbs || []).map((o) => o.id === orb.id ? { ...o, color: e.target.value } : o),
                                    })}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                            </label>
                        ))}
                    </div>
                ) : null}

                <div className="flex-1" />
                <span className="text-[9px] arbo-text-muted italic opacity-60">Vista previa del embed</span>
            </div>

            {/* Resize toolbar */}
            <ResizeToolbar previewWidth={previewWidth} setPreviewWidth={setPreviewWidth} />

            {/* Resizable embed area */}
            <div ref={embedContainerRef}
                className="flex-1 overflow-auto flex justify-center items-start"
                style={{ background: "var(--arbo-surface-2)" }}>
                <div className="flex items-stretch h-full"
                    style={{ width: previewWidth ? `${previewWidth}px` : "100%", minWidth: 280 }}>
                    {/* Left drag handle */}
                    {previewWidth !== null && (
                        <DragHandle onMouseDown={(e) => startResize(e, "left", embedContainerRef)} />
                    )}

                    {/* Embed content */}
                    <EmbedContent
                        schema={schema}
                        styles={styles}
                        cardTitleColor={cardTitleColor}
                        cardSubColor={cardSubColor}
                        previewWidth={previewWidth}
                        containerActualWidth={embedContainerActualWidth}
                        renderViewFields={renderViewFields}
                    />

                    {/* Right drag handle */}
                    {previewWidth !== null && (
                        <DragHandle onMouseDown={(e) => startResize(e, "right", embedContainerRef)} />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Resize toolbar ---
const ResizeToolbar = ({ previewWidth, setPreviewWidth }: {
    previewWidth: number | null;
    setPreviewWidth: (w: number | null) => void;
}) => (
    <div className="flex items-center gap-1.5 px-3 py-2 shrink-0 border-b border-[var(--arbo-border)]" style={{ background: "var(--arbo-surface-3)" }}>
        {[{ label: "375", title: "Mobile" }, { label: "768", title: "Tablet" }, { label: "1280", title: "Desktop" }].map(({ label, title }) => (
            <button key={label} title={title}
                onClick={() => setPreviewWidth(Number(label))}
                className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                    previewWidth === Number(label)
                        ? "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]"
                        : "arbo-text-muted bg-[var(--arbo-surface-2)] hover:bg-[var(--arbo-surface-3)]"
                }`}>
                {label}
            </button>
        ))}
        <button onClick={() => setPreviewWidth(null)}
            className={`text-[10px] px-2 py-1 rounded transition-colors ${
                previewWidth === null
                    ? "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]"
                    : "arbo-text-muted bg-[var(--arbo-surface-2)]"
            }`}>
            Full
        </button>
        <span className="ml-auto text-[10px] font-mono arbo-text-muted tabular-nums">
            {previewWidth ? `${previewWidth}px` : "100%"}
        </span>
    </div>
);

// --- Drag handle ---
const DragHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <div className="w-4 shrink-0 flex items-center justify-center cursor-ew-resize group select-none" onMouseDown={onMouseDown}>
        <div className="w-0.5 h-10 rounded-full bg-[var(--arbo-border)] group-hover:bg-[var(--arbo-accent)] transition-colors" />
    </div>
);

// --- Embed content ---
const EmbedContent = ({ schema, styles, cardTitleColor, cardSubColor, previewWidth, containerActualWidth, renderViewFields }: {
    schema: any;
    styles: any;
    cardTitleColor: string;
    cardSubColor: string;
    previewWidth: number | null;
    containerActualWidth: number;
    renderViewFields: (fields: any[]) => React.ReactNode;
}) => {
    const { t } = useTranslation();
    const effectiveW = previewWidth ?? containerActualWidth;
    const isNarrow = effectiveW > 0 && effectiveW < 1024;
    const embedContactPosition = styles.embedContactPosition || "left";

    const cardStyle = {
        ...getGlassStyle(styles.bgColor || "#1a1a24", styles),
        borderRadius: `${styles.borderRadius ?? 14}px`,
        border: `1px solid ${styles.borderColor || "var(--arbo-border)"}`,
        boxShadow: getShadowCss(styles.shadowStyle, styles.accentColor, styles.gradient),
    };

    const visibleFields = schema.fields.filter((f: any) => !f.name?.startsWith("__page_break_"));

    const embedBg = (styles.embedBgTransparent ?? false)
        ? "transparent"
        : getEmbedBgCss(styles);

    return (
        <div className="flex-1 min-w-0 p-6" style={{ background: embedBg }}>
            {/* Fake external page content above */}
            <div className="max-w-3xl mx-auto mb-6">
                <div className="h-4 w-1/3 rounded bg-[var(--arbo-border)] mb-2 opacity-40" />
                <div className="h-2 w-2/3 rounded bg-[var(--arbo-border)] opacity-20 mb-1" />
                <div className="h-2 w-1/2 rounded bg-[var(--arbo-border)] opacity-15" />
            </div>

            {/* iframe embed area */}
            <div className="max-w-5xl mx-auto px-4 py-6" style={{
                borderRadius: `${styles.borderRadius ?? 14}px`,
                borderColor: "color-mix(in srgb, var(--arbo-accent) 30%, transparent)",
                borderWidth: 1,
                borderStyle: "dashed",
            }}>
                <div className="flex w-full gap-5 max-w-5xl mx-auto" style={{
                    flexDirection: isNarrow
                        ? (embedContactPosition === "left" ? "column" : "column-reverse")
                        : (embedContactPosition === "left" ? "row" : "row-reverse"),
                    alignItems: isNarrow ? "stretch" : "flex-start",
                }}>
                    {/* Contact panel in embed */}
                    {(styles.embedContactEnabled ?? false) && (
                        <EmbedContactPanel styles={styles} cardStyle={cardStyle} isNarrow={isNarrow} />
                    )}

                    {/* Form panel in embed */}
                    <div style={{
                        width: "100%",
                        maxWidth: isNarrow ? undefined : getCardMaxWidth(styles),
                        flex: isNarrow ? undefined : 1,
                    }}>
                        <div className="flex flex-col gap-4 w-full">
                            <div className="w-full overflow-hidden" style={cardStyle}>
                                <div className="h-2" style={getAccentStyle(styles)} />
                                <div className="p-5">
                                    <h1 className="text-xl font-bold" style={{ color: cardTitleColor }}>{schema.title}</h1>
                                    {schema.description && <p className="text-sm mt-1" style={{ color: cardSubColor }}>{schema.description}</p>}
                                </div>
                            </div>
                            <div className="w-full p-6" style={cardStyle}>
                                <div className="flex flex-col gap-4">
                                    {visibleFields.length > 0
                                        ? renderViewFields(visibleFields.slice(0, 3))
                                        : <p className="text-sm arbo-text-muted text-center py-8">{t("form.noFields")}</p>
                                    }
                                    {visibleFields.length > 3 && (
                                        <p className="text-xs arbo-text-muted text-center">{t("form.moreFields", { count: visibleFields.length - 3 })}</p>
                                    )}
                                    <div className="flex justify-end pt-2">
                                        <div className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={getAccentStyle(styles)}>{t("common.submit")}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Powered by */}
                <div className="mt-4 flex items-center justify-center gap-2 opacity-40">
                    <span className="text-[10px] arbo-text-muted">{t("form.poweredBy")}</span>
                    <span className="text-[10px] font-semibold arbo-text-muted">Arbo Forms</span>
                </div>
            </div>

            {/* Fake external page content below */}
            <div className="max-w-3xl mx-auto mt-6">
                <div className="h-2 w-1/2 rounded bg-[var(--arbo-border)] opacity-30 mb-1" />
                <div className="h-2 w-1/3 rounded bg-[var(--arbo-border)] opacity-20" />
            </div>
        </div>
    );
};

// --- Embed contact panel ---
const EmbedContactPanel = ({ styles, cardStyle, isNarrow }: {
    styles: any;
    cardStyle: React.CSSProperties;
    isNarrow: boolean;
}) => {
    const { t } = useTranslation();
    const contactFs = (styles.contactFields || DEFAULT_CONTACT_FIELDS).filter((cf: any) => cf.enabled);
    const contactW = CONTACT_SIZES.find((s) => s.value === (styles.contactSize || "md"))?.width || "320px";

    if (contactFs.length === 0) return null;

    return (
        <div style={{ width: "100%", maxWidth: isNarrow ? undefined : contactW, flexShrink: isNarrow ? undefined : 0 }}>
            <div className="overflow-hidden" style={cardStyle}>
                <div className="h-2" style={getAccentStyle(styles)} />
                <div className="p-5">
                    <h2 className="text-base font-semibold arbo-text mb-1">{t("form.contactTitle")}</h2>
                    <p className="text-xs arbo-text-muted mb-4">{t("form.contactSubtitle")}</p>
                    <div className="flex flex-col gap-3">
                        {contactFs.map((cf: any) => (
                            <div key={cf.id}>
                                <label className="text-xs font-medium arbo-text-secondary block mb-1">{cf.label}</label>
                                <input
                                    type={cf.type === "email" ? "email" : cf.type === "tel" ? "tel" : "text"}
                                    placeholder={cf.placeholder || ""}
                                    disabled
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm opacity-70"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
