import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CirclePlus, TrashBin, ChevronDown, ChevronUp } from "@gravity-ui/icons";
import { getCardMaxWidth, getEmbedBgCss, getAccentStyle } from "../../../utils/style-helpers";
import { CARD_SIZES, PRESET_COLORS } from "../../../constants/editor-constants";
import { SHADOW_OPTIONS } from "../../../constants/style-presets";
import type { GlowOrb } from "../../../types";
import { useEditorContext } from "../EditorContext";

// ─── Collapsible ────────────────────────────────────────────────────────────
const Collapsible = ({ title, children, defaultOpen = false }: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) => {
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

// ─── Toggle ──────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange, label, sub }: { value: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) => (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
        <div>
            <span className="text-xs arbo-text">{label}</span>
            {sub && <p className="text-[9px] arbo-text-muted mt-0.5">{sub}</p>}
        </div>
        <button
            onClick={() => onChange(!value)}
            className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${value ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
        >
            <div className={`size-4 rounded-full bg-white transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
        </button>
    </div>
);

// ─── EmbedTab ────────────────────────────────────────────────────────────────
export const EmbedTab = () => {
    const { t } = useTranslation();
    const { schema, styles, updateStyles } = useEditorContext();

    return (
        <div className="flex flex-col gap-3">
            {/* Fondo */}
            <Collapsible title="Fondo del embed" defaultOpen={true}>
                <Toggle
                    value={styles.embedBgTransparent ?? false}
                    onChange={(v) => updateStyles({ embedBgTransparent: v })}
                    label={t("editor.embedTab.noBg")}
                    sub="El sitio externo mostrará su propio fondo"
                />
                {!(styles.embedBgTransparent ?? false) && (
                    <div>
                        <label className="text-[10px] arbo-text-secondary block mb-1.5">{t("editor.pageTab.pageBg")}</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={styles.pageBgColor || "#0f0f14"}
                                onChange={(e) => updateStyles({ pageBgColor: e.target.value })}
                                className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
                            <span className="text-[9px] arbo-text-muted font-mono">{styles.pageBgColor || "default"}</span>
                            {styles.pageBgColor && (
                                <button onClick={() => updateStyles({ pageBgColor: undefined })}
                                    className="text-[9px] arbo-text-muted hover:text-[var(--arbo-accent)]">{t("common.reset")}</button>
                            )}
                        </div>
                    </div>
                )}
            </Collapsible>

            {/* Tarjeta */}
            <Collapsible title="Tarjeta">
                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1">Ancho máximo</label>
                    <div className="grid grid-cols-4 gap-1">
                        {CARD_SIZES.map((size) => (
                            <button key={size.value} onClick={() => updateStyles({ cardSize: size.value as any })}
                                className={`px-1 py-1.5 rounded-md text-[9px] font-medium transition-colors ${(styles.cardSize || "md") === size.value ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {size.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.borderRadius")}</label>
                    <div className="flex items-center gap-3">
                        <input type="range" min="0" max="24" step="2" value={styles.borderRadius ?? 14}
                            onChange={(e) => updateStyles({ borderRadius: Number(e.target.value) })}
                            className="flex-1 accent-[var(--arbo-accent)]" />
                        <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.borderRadius ?? 14}px</span>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.shadow")}</label>
                    <div className="grid grid-cols-5 gap-1">
                        {SHADOW_OPTIONS.map((opt) => (
                            <button key={opt.value} onClick={() => updateStyles({ shadowStyle: opt.value as any })}
                                className={`px-1 py-1.5 rounded-md text-[9px] font-medium transition-colors ${(styles.shadowStyle || "md") === opt.value ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Collapsible>

            {/* Colores */}
            <Collapsible title="Colores">
                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1.5">Color de acento</label>
                    <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map((color) => (
                            <button key={color} onClick={() => updateStyles({ accentColor: color, gradient: undefined })}
                                className={`size-7 rounded-lg transition-all ${styles.accentColor === color && !styles.gradient ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--arbo-surface)]" : "hover:scale-110"}`}
                                style={{ background: color }} />
                        ))}
                        <div className="relative">
                            <input type="color" value={styles.accentColor || "#4ADE80"}
                                onChange={(e) => updateStyles({ accentColor: e.target.value, gradient: undefined })}
                                className="absolute inset-0 opacity-0 cursor-pointer size-7" />
                            <div className="size-7 rounded-lg border-2 border-dashed border-[var(--arbo-border)] flex items-center justify-center arbo-text-muted text-xs">+</div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1.5">Fondo de la tarjeta</label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={styles.bgColor || "#1a1a24"}
                            onChange={(e) => updateStyles({ bgColor: e.target.value })}
                            className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
                        <span className="text-[9px] arbo-text-muted font-mono">{styles.bgColor || "default"}</span>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1.5">Color del borde</label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={styles.borderColor || "#2e2e3e"}
                            onChange={(e) => updateStyles({ borderColor: e.target.value })}
                            className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
                        <span className="text-[9px] arbo-text-muted font-mono">{styles.borderColor || "default"}</span>
                        {styles.borderColor && (
                            <button onClick={() => updateStyles({ borderColor: undefined })}
                                className="text-[9px] arbo-text-muted hover:text-[var(--arbo-accent)]">{t("common.reset")}</button>
                        )}
                    </div>
                </div>
            </Collapsible>

            {/* Glass */}
            <Collapsible title="Efecto vidrio">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] arbo-text-muted w-20 shrink-0">Transparencia</span>
                    <input type="range" min="0" max="100" step="5" value={styles.cardOpacity ?? 100}
                        onChange={(e) => updateStyles({ cardOpacity: Number(e.target.value) })}
                        className="flex-1 accent-[var(--arbo-accent)]" />
                    <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.cardOpacity ?? 100}%</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] arbo-text-muted w-20 shrink-0">Desenfoque</span>
                    <input type="range" min="0" max="20" step="1" value={styles.cardBlur ?? 0}
                        onChange={(e) => updateStyles({ cardBlur: Number(e.target.value) })}
                        className="flex-1 accent-[var(--arbo-accent)]" />
                    <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.cardBlur ?? 0}px</span>
                </div>
            </Collapsible>

            {/* Luces */}
            <GlowOrbsSection />

            {/* Contacto */}
            <Collapsible title="Contacto">
                <Toggle
                    value={styles.embedContactEnabled ?? false}
                    onChange={(v) => updateStyles({ embedContactEnabled: v })}
                    label={t("editor.embedTab.showContact")}
                />
                {(styles.embedContactEnabled ?? false) && (
                    <div>
                        <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.embedTab.contactPosition")}</label>
                        <div className="grid grid-cols-2 gap-1">
                            {(["left", "right"] as const).map((pos) => (
                                <button key={pos} onClick={() => updateStyles({ embedContactPosition: pos })}
                                    className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${(styles.embedContactPosition || "left") === pos ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                    {pos === "left" ? t("editor.embedTab.left") : t("editor.embedTab.right")}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Collapsible>

            <div className="border-t border-[var(--arbo-border)]" />

            {/* Embed code */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1.5">{t("editor.embedTab.embedCode")}</label>
                {schema.slug ? (
                    <EmbedCodeBlock schema={schema} styles={styles} />
                ) : (
                    <p className="text-[10px] arbo-text-muted">{t("editor.embedTab.saveFirst")}</p>
                )}
            </div>

            <div className="border-t border-[var(--arbo-border)]" />

            {/* Export HTML */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1.5">{t("editor.embedTab.exportHtml")}</label>
                <p className="text-[9px] arbo-text-muted mb-2">{t("editor.embedTab.exportHtmlDesc")}</p>
                {schema.slug ? (
                    <ExportHtmlButton schema={schema} styles={styles} />
                ) : (
                    <p className="text-[10px] arbo-text-muted">{t("editor.embedTab.saveFirst")}</p>
                )}
            </div>
        </div>
    );
};

// ─── Glow orbs section ───────────────────────────────────────────────────────
const GlowOrbsSection = () => {
    const { t } = useTranslation();
    const { styles, updateStyles } = useEditorContext();
    const previewRef = useRef<HTMLDivElement>(null);
    const dragMovedRef = useRef(false);

    const orbs: GlowOrb[] = styles.embedGlowOrbs || [];
    const glowOn = styles.embedGlowEnabled ?? false;

    const updateOrb = (id: string, patch: Partial<GlowOrb>) =>
        updateStyles({ embedGlowOrbs: orbs.map((o) => o.id === id ? { ...o, ...patch } : o) });

    const removeOrb = (id: string) =>
        updateStyles({ embedGlowOrbs: orbs.filter((o) => o.id !== id) });

    const addOrb = (x = 50, y = 50) => {
        const color = PRESET_COLORS[orbs.length % PRESET_COLORS.length];
        const newOrb: GlowOrb = { id: crypto.randomUUID(), x, y, size: 60, opacity: 50, color };
        updateStyles({ embedGlowOrbs: [...orbs, newOrb] });
    };

    const startDrag = (e: React.MouseEvent, orbId: string) => {
        e.preventDefault();
        e.stopPropagation();
        dragMovedRef.current = false;
        const onMove = (ev: MouseEvent) => {
            if (!previewRef.current) return;
            dragMovedRef.current = true;
            const rect = previewRef.current.getBoundingClientRect();
            const x = Math.round(Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)));
            const y = Math.round(Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)));
            updateOrb(orbId, { x, y });
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const handlePreviewClick = (e: React.MouseEvent) => {
        if (dragMovedRef.current) { dragMovedRef.current = false; return; }
        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        addOrb(
            Math.round(((e.clientX - rect.left) / rect.width) * 100),
            Math.round(((e.clientY - rect.top) / rect.height) * 100),
        );
    };

    return (
        <Collapsible title={t("editor.pageTab.bgLights")}>
            <div className="flex items-center justify-between">
                <p className="text-[9px] arbo-text-muted">{t("editor.pageTab.clickToAdd")}</p>
                <button
                    onClick={() => {
                        if (!glowOn && orbs.length === 0) {
                            const accent = styles.accentColor || "#4ADE80";
                            updateStyles({
                                embedGlowEnabled: true,
                                embedGlowOrbs: [{ id: crypto.randomUUID(), x: 30, y: 25, size: 70, opacity: 45, color: accent }],
                            });
                        } else {
                            updateStyles({ embedGlowEnabled: !glowOn });
                        }
                    }}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${glowOn ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                >
                    <div className={`size-4 rounded-full bg-white transition-transform ${glowOn ? "translate-x-4" : "translate-x-0"}`} />
                </button>
            </div>

            {glowOn && (
                <>
                    <div
                        ref={previewRef}
                        className="relative rounded-lg overflow-hidden border border-[var(--arbo-border)] select-none"
                        style={{ height: 120, background: getEmbedBgCss(styles), cursor: "crosshair" }}
                        onClick={handlePreviewClick}
                    >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-2/5 h-14 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                        </div>
                        {orbs.map((orb) => (
                            <div key={orb.id} className="absolute flex items-center justify-center"
                                style={{ left: `${orb.x}%`, top: `${orb.y}%`, transform: "translate(-50%, -50%)", width: 18, height: 18, cursor: "grab", zIndex: 10 }}
                                onMouseDown={(e) => startDrag(e, orb.id)}>
                                <div className="rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125"
                                    style={{ width: 12, height: 12, background: orb.color, boxShadow: `0 0 8px ${orb.color}` }} />
                            </div>
                        ))}
                        {orbs.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] text-white/30">{t("editor.pageTab.clickToAddLight")}</span>
                            </div>
                        )}
                    </div>

                    {orbs.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {orbs.map((orb, idx) => (
                                <div key={orb.id} className="rounded-lg p-2.5 flex flex-col gap-2 border"
                                    style={{ background: "var(--arbo-surface-2)", borderColor: `${orb.color}44` }}>
                                    <div className="flex items-center gap-2">
                                        <div className="size-3 rounded-full shrink-0" style={{ background: orb.color, boxShadow: `0 0 6px ${orb.color}` }} />
                                        <span className="text-[10px] font-semibold arbo-text flex-1">{t("editor.pageTab.light", { index: idx + 1 })}</span>
                                        <div className="flex items-center gap-1.5">
                                            {PRESET_COLORS.slice(0, 5).map((c) => (
                                                <button key={c} onClick={() => updateOrb(orb.id, { color: c })}
                                                    className="size-3.5 rounded-full transition-transform hover:scale-125"
                                                    style={{ background: c, outline: orb.color === c ? `2px solid ${c}` : "none", outlineOffset: 1 }} />
                                            ))}
                                            <input type="color" value={orb.color} onChange={(e) => updateOrb(orb.id, { color: e.target.value })}
                                                className="size-4 rounded cursor-pointer border-0 bg-transparent p-0" title="Color personalizado" />
                                        </div>
                                        <button onClick={() => removeOrb(orb.id)} className="p-1 rounded text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] transition-colors shrink-0">
                                            <TrashBin className="size-3" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] arbo-text-muted w-14 shrink-0">{t("editor.pageTab.lightSize")}</span>
                                        <input type="range" min="20" max="150" step="5" value={orb.size}
                                            onChange={(e) => updateOrb(orb.id, { size: Number(e.target.value) })}
                                            className="flex-1" style={{ accentColor: orb.color }} />
                                        <span className="text-[9px] arbo-text-muted font-mono w-7 text-right">{orb.size}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] arbo-text-muted w-14 shrink-0">{t("editor.pageTab.lightIntensity")}</span>
                                        <input type="range" min="5" max="90" step="5" value={orb.opacity}
                                            onChange={(e) => updateOrb(orb.id, { opacity: Number(e.target.value) })}
                                            className="flex-1" style={{ accentColor: orb.color }} />
                                        <span className="text-[9px] arbo-text-muted font-mono w-7 text-right">{orb.opacity}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={() => addOrb()}
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed text-[10px] font-medium transition-colors arbo-text-muted hover:text-[var(--arbo-accent)] hover:border-[var(--arbo-accent)]"
                        style={{ borderColor: "var(--arbo-border)" }}>
                        <CirclePlus className="size-3.5" /> {t("editor.pageTab.addLight")}
                    </button>
                </>
            )}
        </Collapsible>
    );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const buildIframeUrl = (schema: any, styles: any) => {
    const contactParam = (styles.embedContactEnabled ?? false) ? "?contact=1" : "";
    return `${window.location.origin}/embed/${schema.slug}${contactParam}`;
};

const buildIframeTag = (schema: any, styles: any) => {
    const src = buildIframeUrl(schema, styles);
    const radius = styles.borderRadius ?? 14;
    const maxWidth = getCardMaxWidth(styles);
    return `<iframe src="${src}" width="100%" height="600" frameborder="0" style="border:none; border-radius:${radius}px; max-width:${maxWidth};"></iframe>`;
};

const EmbedCodeBlock = ({ schema, styles }: { schema: any; styles: any }) => {
    const { t } = useTranslation();
    const code = buildIframeTag(schema, styles);

    return (
        <div className="relative">
            <pre className="p-3 rounded-lg bg-[var(--arbo-bg)] border border-[var(--arbo-border)] text-[9px] arbo-text-muted font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {code}
            </pre>
            <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="absolute top-1.5 right-1.5 arbo-btn arbo-btn-secondary text-[9px] py-1 px-2"
            >{t("common.copy")}</button>
        </div>
    );
};

const ExportHtmlButton = ({ schema, styles }: { schema: any; styles: any }) => {
    const { t } = useTranslation();

    const handleExport = useCallback(() => {
        const title = schema.title || "Form";
        const accentColor = styles.accentColor || "#4ADE80";

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f0f17;
            color: #e2e2e8;
        }
        iframe {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .footer {
            position: fixed;
            bottom: 0.5rem;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 0.65rem;
            color: #555;
            pointer-events: none;
            z-index: 10;
        }
        .footer a { color: ${escapeHtml(accentColor)}; text-decoration: none; pointer-events: auto; }
        .footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <iframe src="${escapeHtml(buildIframeUrl(schema, styles))}" allowtransparency="true"></iframe>
    <p class="footer">Powered by <a href="${window.location.origin}" target="_blank" rel="noopener">Arbo Forms</a></p>
</body>
</html>`;

        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(schema.slug || "form")}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [schema, styles]);

    return (
        <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text hover:border-[var(--arbo-accent)]/50 hover:text-[var(--arbo-accent)]"
        >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("editor.embedTab.downloadHtml")}
        </button>
    );
};

const escapeHtml = (str: string): string =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
