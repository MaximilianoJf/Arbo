import { useTranslation } from "react-i18next";
import {
    getAccentStyle, getPageBgCss, getCardMaxWidth, getTransitionSpeed, applyAlpha,
} from "../../utils/style-helpers";
import { CONTACT_SIZES, PRESET_COLORS } from "../../constants/editor-constants";
import type { GlowOrb } from "../../types";
import { useEditorContext } from "./EditorContext";
import { PageGridEditor } from "./PageGridEditor";
import { HeadingPreview, HeaderPreview, ContactPreview, FormPreview, FooterPreview, LogoPreview } from "./PageElements";

export const PagePreviewCanvas = () => {
    const { t } = useTranslation();
    const {
        styles, updateStyles,
        previewWidth, setPreviewWidth,
        previewContainerRef, previewContainerActualWidth,
        startResize,
    } = useEditorContext();

    return (
        <div className="flex-1 flex flex-col min-h-0 gap-0 rounded-xl overflow-hidden border border-[var(--arbo-border)]">
            {/* Resize toolbar — hidden in free grid mode (grid governs width) */}
            {!styles.pageLayout?.enabled && (
                <ResizeToolbar previewWidth={previewWidth} setPreviewWidth={setPreviewWidth} />
            )}

            {/* Quick color bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 border-b border-[var(--arbo-border)]" style={{ background: "var(--arbo-surface-3)" }}>
                <span className="text-[9px] font-semibold arbo-text-muted uppercase tracking-wider shrink-0">{t("editor.preview.colors")}</span>
                {([
                    { label: t("editor.preview.page"), value: styles.pageBgColor || "#0f0f14", key: "pageBgColor" },
                    { label: t("editor.preview.card"), value: styles.bgColor || "#1a1a24", key: "bgColor" },
                ] as const).map(({ label, value, key }) => (
                    <label key={key} className="relative flex items-center gap-1 cursor-pointer rounded px-1.5 py-0.5 hover:bg-[var(--arbo-surface-2)] transition-colors">
                        <div className="size-3 rounded-full border border-[var(--arbo-border)]" style={{ background: value }} />
                        <span className="text-[9px] arbo-text-muted">{label}</span>
                        <input type="color" value={value} onChange={(e) => updateStyles({ [key]: e.target.value } as any)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </label>
                ))}
                <label className="relative flex items-center gap-1 cursor-pointer rounded px-1.5 py-0.5 hover:bg-[var(--arbo-surface-2)] transition-colors">
                    <div className="size-3 rounded-full" style={getAccentStyle(styles)} />
                    <span className="text-[9px] arbo-text-muted">{t("editor.preview.accent")}</span>
                    <input type="color" value={styles.accentColor || "#4ADE80"} onChange={(e) => updateStyles({ accentColor: e.target.value, gradient: undefined })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </label>

                {/* Quick lights (glow orbs) — edit every light's color inline */}
                <QuickLights />

                <div className="flex-1" />
                <span className="text-[9px] arbo-text-muted italic opacity-60">{t("editor.preview.clickTitleToEdit")}</span>
            </div>

            {/* Free grid layout editor OR the resizable live preview */}
            {styles.pageLayout?.enabled ? (
                <PageGridEditor />
            ) : (
                <div ref={previewContainerRef}
                    className="flex-1 overflow-auto flex justify-center items-start"
                    style={{ background: "var(--arbo-surface)" }}>
                    <div className="flex items-stretch h-full"
                        style={{ width: previewWidth ? `${previewWidth}px` : "100%", minWidth: 280 }}>
                        {/* Left drag handle */}
                        {previewWidth !== null && (
                            <DragHandle side="left" onMouseDown={(e) => startResize(e, "left")} />
                        )}

                        {/* Preview content */}
                        <PreviewContent
                            previewWidth={previewWidth}
                            containerActualWidth={previewContainerActualWidth}
                        />

                        {/* Right drag handle */}
                        {previewWidth !== null && (
                            <DragHandle side="right" onMouseDown={(e) => startResize(e, "right")} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Quick lights: inline color swatches for every glow orb ---
const QuickLights = () => {
    const { styles, updateStyles } = useEditorContext();
    const orbs: GlowOrb[] = styles.pageGlowOrbs || [];

    const updateOrbColor = (id: string, color: string) =>
        updateStyles({ pageGlowOrbs: orbs.map((o) => (o.id === id ? { ...o, color } : o)) });

    const addOrb = () => {
        const color = PRESET_COLORS[orbs.length % PRESET_COLORS.length];
        const newOrb: GlowOrb = { id: crypto.randomUUID(), x: 50, y: 50, size: 60, opacity: 50, color };
        updateStyles({ pageGlowEnabled: true, pageGlowOrbs: [...orbs, newOrb] });
    };

    const removeOrb = (id: string) =>
        updateStyles({ pageGlowOrbs: orbs.filter((o) => o.id !== id) });

    return (
        <>
            <div className="w-px h-4 bg-[var(--arbo-border)] shrink-0" />
            <span className="text-[9px] font-semibold arbo-text-muted uppercase tracking-wider shrink-0">Luces</span>
            <div className="flex items-center gap-1 flex-wrap">
                {orbs.map((orb, i) => (
                    <div key={orb.id} className="relative group">
                        <label className="relative flex items-center cursor-pointer rounded p-0.5 hover:bg-[var(--arbo-surface-2)] transition-colors" title={`Luz ${i + 1} — clic para cambiar color`}>
                            <div className="size-3.5 rounded-full border border-white/30" style={{ background: orb.color, boxShadow: `0 0 5px ${orb.color}` }} />
                            <input type="color" value={orb.color} onChange={(e) => updateOrbColor(orb.id, e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                        </label>
                        <button
                            onClick={() => removeOrb(orb.id)}
                            className="absolute -top-1 -right-1 size-3 rounded-full bg-[var(--arbo-danger)] text-white text-[8px] leading-none items-center justify-center hidden group-hover:flex"
                            title="Quitar luz"
                        >×</button>
                    </div>
                ))}
                <button
                    onClick={addOrb}
                    className="flex items-center justify-center size-4 rounded-full border border-dashed border-[var(--arbo-border)] arbo-text-muted hover:text-[var(--arbo-accent)] hover:border-[var(--arbo-accent)] transition-colors shrink-0"
                    title="Agregar luz"
                >
                    <span className="text-[11px] leading-none">+</span>
                </button>
            </div>
        </>
    );
};

// --- Resize toolbar ---
const ResizeToolbar = ({ previewWidth, setPreviewWidth }: {
    previewWidth: number | null;
    setPreviewWidth: (w: number | null) => void;
}) => (
    <div className="flex items-center gap-1.5 px-3 py-2 shrink-0 border-b border-[var(--arbo-border)]" style={{ background: "var(--arbo-surface-3)" }}>
        {[
            { label: "375", title: "Mobile" },
            { label: "768", title: "Tablet" },
            { label: "1280", title: "Desktop" },
        ].map(({ label, title }) => (
            <button key={label} title={title}
                onClick={() => setPreviewWidth(Number(label))}
                className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                    previewWidth === Number(label)
                        ? "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]"
                        : "arbo-text-muted hover:arbo-text-secondary bg-[var(--arbo-surface-2)] hover:bg-[var(--arbo-surface-3)]"
                }`}>
                {label}
            </button>
        ))}
        <button onClick={() => setPreviewWidth(null)}
            className={`text-[10px] px-2 py-1 rounded transition-colors ${
                previewWidth === null
                    ? "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]"
                    : "arbo-text-muted hover:arbo-text-secondary bg-[var(--arbo-surface-2)]"
            }`}>
            Full
        </button>
        <span className="ml-auto text-[10px] font-mono arbo-text-muted tabular-nums">
            {previewWidth ? `${previewWidth}px` : "100%"}
        </span>
    </div>
);

// --- Drag handle ---
const DragHandle = ({ side, onMouseDown }: {
    side: "left" | "right";
    onMouseDown: (e: React.MouseEvent) => void;
}) => (
    <div className="w-4 shrink-0 flex items-center justify-center cursor-ew-resize group select-none"
        onMouseDown={onMouseDown}>
        <div className="w-0.5 h-10 rounded-full bg-[var(--arbo-border)] group-hover:bg-[var(--arbo-accent)] transition-colors" />
    </div>
);

// --- Preview content (contact + form panels) — uses the shared page elements ---
const PreviewContent = ({ previewWidth, containerActualWidth }: {
    previewWidth: number | null;
    containerActualWidth: number;
}) => {
    const { styles } = useEditorContext();
    const effectiveW = previewWidth ?? containerActualWidth;
    const isNarrow = effectiveW > 0 && effectiveW < 1024;
    const contactPosition = styles.contactPosition || "left";
    const hasGlass = (styles.cardOpacity ?? 100) < 100 || (styles.cardBlur ?? 0) > 0;
    const accent = styles.accentColor || "#4ADE80";
    const glowBg = getPageBgCss(styles);
    const previewPageBg = hasGlass && !styles.pageGlowEnabled
        ? `radial-gradient(ellipse at 25% 35%, ${accent}40 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, #8B5CF640 0%, transparent 55%), ${glowBg}`
        : glowBg;

    const formVAlign = styles.formVerticalAlign || "start";
    const vAlignClass = formVAlign === "center" ? "justify-center" : formVAlign === "end" ? "justify-end" : "";

    const animVars = {
        "--arbo-transition-speed": getTransitionSpeed(styles),
        "--arbo-hover-glow-color": applyAlpha(accent, 0.35),
        "--arbo-focus-color": applyAlpha(accent, 0.3),
    } as React.CSSProperties;

    const contactW = CONTACT_SIZES.find((s) => s.value === (styles.contactSize || "md"))?.width || "320px";

    return (
        <div className={`flex-1 min-w-0 flex flex-col min-h-[500px] ${vAlignClass}`} style={{ background: previewPageBg, ...animVars }}>
            <div className="p-6">
                {/* Logo — same element as in grid mode, fixed centered position here */}
                {(styles.logoEnabled ?? true) && (
                    <div className="max-w-5xl mx-auto mb-4" style={{ height: 44 }}><LogoPreview /></div>
                )}
                {(styles.pageHeadingEnabled ?? false) && (
                    <div className="max-w-5xl mx-auto mb-5"><HeadingPreview /></div>
                )}

                <div className="flex w-full gap-5 max-w-5xl mx-auto"
                    style={{
                        flexDirection: isNarrow
                            ? (contactPosition === "left" ? "column" : "column-reverse")
                            : (contactPosition === "left" ? "row" : "row-reverse"),
                        alignItems: isNarrow ? "stretch" : "flex-start",
                    }}>
                    {(styles.contactEnabled ?? false) && (
                        <div style={{ width: "100%", maxWidth: isNarrow ? undefined : contactW, flexShrink: isNarrow ? undefined : 0 }}>
                            <ContactPreview />
                        </div>
                    )}
                    <div style={{ width: "100%", maxWidth: isNarrow ? undefined : getCardMaxWidth(styles), flex: isNarrow ? undefined : 1 }}>
                        <div className="flex flex-col gap-4 w-full">
                            {(styles.cardHeaderEnabled !== false) && <HeaderPreview />}
                            <FormPreview />
                        </div>
                    </div>
                </div>
            </div>
            <FooterPreview />
        </div>
    );
};
