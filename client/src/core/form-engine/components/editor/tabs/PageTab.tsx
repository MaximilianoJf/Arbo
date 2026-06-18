import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CirclePlus, TrashBin, ChevronDown, ChevronUp } from "@gravity-ui/icons";
import { CARD_SIZES, PRESET_COLORS, PAGE_HEADING_SIZES } from "../../../constants/editor-constants";
import { SHADOW_OPTIONS } from "../../../constants/style-presets";
import { getPageBgCss, getPageHeadingSizeClass, buildDefaultPageLayout, normalizePageLayout } from "../../../utils/style-helpers";
import type { GlowOrb, PageElementKey } from "../../../types";
import { useEditorContext } from "../EditorContext";
import { ContactPanelSettings } from "./FormStylesTab";
import { PageDecorInspector } from "../PageDecorInspector";

/** Reusable collapsible section. `forceOpen` opens it when the matching element is selected on the canvas. */
const Collapsible = ({ title, children, defaultOpen = true, forceOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean; forceOpen?: boolean }) => {
    const [open, setOpen] = useState(defaultOpen);
    useEffect(() => {
        if (forceOpen) setOpen(true);
    }, [forceOpen]);
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

export const PageTab = () => {
    const { t } = useTranslation();
    const { styles, updateStyles, setSchema, glowPreviewRef, draggingGlowId, setDraggingGlowId, glowDragMoved, selectedPageElement } = useEditorContext();

    const orbs: GlowOrb[] = styles.pageGlowOrbs || [];
    const glowOn = styles.pageGlowEnabled ?? false;
    const gridOn = !!styles.pageLayout?.enabled;   // free grid governs size & position
    // Every section is always available in both modes; selecting an element on the
    // grid canvas just auto-opens its section instead of hiding the others.
    const isSelected = (key: PageElementKey) => gridOn && selectedPageElement === key;
    // Decoration selected on the grid canvas → contextual inspector
    const selectedDecor = (styles.pageLayout?.decors || []).find((d) => d.id === selectedPageElement);

    const updateOrb = (id: string, patch: Partial<GlowOrb>) =>
        updateStyles({ pageGlowOrbs: orbs.map((o) => o.id === id ? { ...o, ...patch } : o) });

    const removeOrb = (id: string) =>
        updateStyles({ pageGlowOrbs: orbs.filter((o) => o.id !== id) });

    const addOrb = (x = 50, y = 50) => {
        const color = PRESET_COLORS[orbs.length % PRESET_COLORS.length];
        const newOrb: GlowOrb = { id: crypto.randomUUID(), x, y, size: 60, opacity: 50, color };
        updateStyles({ pageGlowOrbs: [...orbs, newOrb] });
    };

    const startOrbDrag = (e: React.MouseEvent, orbId: string) => {
        e.preventDefault();
        e.stopPropagation();
        glowDragMoved.current = false;
        setDraggingGlowId(orbId);
        const onMove = (ev: MouseEvent) => {
            if (!glowPreviewRef.current) return;
            glowDragMoved.current = true;
            const rect = glowPreviewRef.current.getBoundingClientRect();
            const x = Math.round(Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)));
            const y = Math.round(Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)));
            setSchema((prev) => ({
                ...prev,
                styles: {
                    ...prev.styles,
                    pageGlowOrbs: (prev.styles?.pageGlowOrbs || []).map((o) =>
                        o.id === orbId ? { ...o, x, y } : o
                    ),
                },
            }));
        };
        const onUp = () => {
            setDraggingGlowId(null);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const handlePreviewClick = (e: React.MouseEvent) => {
        if (glowDragMoved.current) { glowDragMoved.current = false; return; }
        if (!glowPreviewRef.current) return;
        const rect = glowPreviewRef.current.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
        addOrb(x, y);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Free grid positioning — first thing in this tab, always open */}
            <Collapsible title="Posición de elementos" defaultOpen={true}>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <div>
                        <span className="text-xs arbo-text">Diseño libre (grid)</span>
                        <p className="text-[9px] arbo-text-muted mt-0.5">Posicioná encabezado, contacto y formulario donde quieras</p>
                    </div>
                    <button
                        onClick={() => {
                            const enabled = !(styles.pageLayout?.enabled);
                            if (enabled) {
                                updateStyles({ pageLayout: { ...normalizePageLayout(styles.pageLayout), enabled: true } });
                            } else {
                                updateStyles({ pageLayout: { ...(styles.pageLayout || buildDefaultPageLayout()), enabled: false } });
                            }
                        }}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${styles.pageLayout?.enabled ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                    >
                        <div className={`size-4 rounded-full bg-white transition-transform ${styles.pageLayout?.enabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>

                {styles.pageLayout?.enabled && (
                    <>
                        <div>
                            <label className="text-[10px] arbo-text-secondary block mb-1">Columnas de la grilla</label>
                            <div className="grid grid-cols-3 gap-1">
                                {[8, 12, 16].map((c) => (
                                    <button key={c}
                                        onClick={() => {
                                            const lay = styles.pageLayout || buildDefaultPageLayout();
                                            const clampItems = (arr: typeof lay.items) => arr.map((it) => {
                                                const x = Math.min(it.x, c - 1);
                                                return { ...it, x, w: Math.max(1, Math.min(it.w, c - x)) };
                                            });
                                            updateStyles({ pageLayout: {
                                                ...lay, cols: c,
                                                items: clampItems(lay.items),
                                                ...(lay.tablet ? { tablet: clampItems(lay.tablet) } : {}),
                                                ...(lay.mobile ? { mobile: clampItems(lay.mobile) } : {}),
                                            } });
                                        }}
                                        className={`px-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${(styles.pageLayout?.cols ?? 12) === c ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => updateStyles({ pageLayout: buildDefaultPageLayout() })}
                            className="text-[10px] arbo-text-muted hover:text-[var(--arbo-accent)] self-start"
                        >
                            ↺ Restablecer posiciones
                        </button>
                        <p className="text-[9px] arbo-text-muted italic">Clic en un elemento del lienzo para abrir su sección de ajustes abajo.</p>
                    </>
                )}
            </Collapsible>

            {/* Adorno seleccionado en el lienzo */}
            {gridOn && selectedDecor && (
                <Collapsible title="Adorno" defaultOpen={true}>
                    <PageDecorInspector decor={selectedDecor} />
                </Collapsible>
            )}

            {/* Page BG — always visible (compact) */}
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">{t("editor.pageTab.pageBg")}</label>
                <div className="flex items-center gap-2">
                    <input type="color" value={styles.pageBgColor || "#0f0f14"} onChange={(e) => updateStyles({ pageBgColor: e.target.value })} className="size-5 rounded cursor-pointer border border-[var(--arbo-border)]" />
                    <span className="text-[9px] arbo-text-muted font-mono">{styles.pageBgColor || "default"}</span>
                    {styles.pageBgColor && <button onClick={() => updateStyles({ pageBgColor: undefined })} className="text-[9px] arbo-text-muted hover:text-[var(--arbo-accent)]">{t("common.reset")}</button>}
                </div>
            </div>

            {/* Imagen de fondo (elemento posicionable en el grid) */}
            <Collapsible title="Imagen de fondo" defaultOpen={false}>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] arbo-text-secondary">URL de la imagen</label>
                    <div className="flex items-center gap-1.5">
                        <input
                            type="url"
                            value={styles.pageBgImage || ""}
                            onChange={(e) => updateStyles({ pageBgImage: e.target.value })}
                            placeholder="https://…/imagen.jpg"
                            className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs outline-none focus:border-[var(--arbo-accent)]"
                        />
                        {styles.pageBgImage && (
                            <button onClick={() => updateStyles({ pageBgImage: undefined })} className="text-[10px] arbo-text-muted hover:text-[var(--arbo-danger)] px-1">×</button>
                        )}
                    </div>
                </div>

                {styles.pageBgImage && (
                    <>
                        <div>
                            <label className="text-[10px] arbo-text-secondary block mb-1">Ajuste</label>
                            <div className="grid grid-cols-2 gap-1">
                                {([{ v: "cover", label: "Cubrir" }, { v: "contain", label: "Contener" }] as const).map(({ v, label }) => (
                                    <button key={v} onClick={() => updateStyles({ pageImageFit: v })}
                                        className={`px-1 py-1.5 rounded-md text-[9px] font-medium transition-colors ${(styles.pageImageFit || "cover") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Encuadre — qué parte de la imagen se ve (funciona en ambos modos) */}
                        <div>
                            <label className="text-[10px] arbo-text-secondary block mb-1">Encuadre horizontal</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="100" step="5" value={styles.pageImagePosX ?? 50}
                                    onChange={(e) => updateStyles({ pageImagePosX: Number(e.target.value) })}
                                    className="flex-1 accent-[var(--arbo-accent)]" />
                                <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.pageImagePosX ?? 50}%</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] arbo-text-secondary block mb-1">Encuadre vertical</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="100" step="5" value={styles.pageImagePosY ?? 50}
                                    onChange={(e) => updateStyles({ pageImagePosY: Number(e.target.value) })}
                                    className="flex-1 accent-[var(--arbo-accent)]" />
                                <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.pageImagePosY ?? 50}%</span>
                            </div>
                        </div>

                        {/* Anclaje vertical — solo aplica cuando la imagen es un bloque full-bleed del grid */}
                        {gridOn && (
                            <div>
                                <label className="text-[10px] arbo-text-secondary block mb-1">Posición vertical</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {([
                                        { v: "none", label: "Libre" },
                                        { v: "top", label: "Tope superior" },
                                        { v: "bottom", label: "Tope inferior" },
                                    ] as const).map(({ v, label }) => (
                                        <button key={v} onClick={() => updateStyles({ pageImageSnap: v })}
                                            className={`px-1 py-1.5 rounded-md text-[9px] font-medium transition-colors ${(styles.pageImageSnap || "none") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] arbo-text-muted italic mt-1">Pegá la imagen al borde de la pantalla (cuando ocupa todo el ancho del grid).</p>
                            </div>
                        )}

                        {/* Fades — difuminado hacia el fondo */}
                        <div>
                            <label className="text-[10px] arbo-text-secondary block mb-1">Difuminar arriba</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="80" step="5" value={styles.pageImageFadeTop ?? 0}
                                    onChange={(e) => updateStyles({ pageImageFadeTop: Number(e.target.value) })}
                                    className="flex-1 accent-[var(--arbo-accent)]" />
                                <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.pageImageFadeTop ?? 0}%</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] arbo-text-secondary block mb-1">Difuminar abajo</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="0" max="80" step="5" value={styles.pageImageFadeBottom ?? 0}
                                    onChange={(e) => updateStyles({ pageImageFadeBottom: Number(e.target.value) })}
                                    className="flex-1 accent-[var(--arbo-accent)]" />
                                <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.pageImageFadeBottom ?? 0}%</span>
                            </div>
                        </div>

                        {/* Opacidad */}
                        <div>
                            <label className="text-[10px] arbo-text-secondary block mb-1">Opacidad</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min="10" max="100" step="5" value={styles.pageImageOpacity ?? 100}
                                    onChange={(e) => updateStyles({ pageImageOpacity: Number(e.target.value) })}
                                    className="flex-1 accent-[var(--arbo-accent)]" />
                                <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.pageImageOpacity ?? 100}%</span>
                            </div>
                        </div>

                        {/* Borde redondeado — solo cuando la imagen es un bloque del grid */}
                        {gridOn && (
                            <div>
                                <label className="text-[10px] arbo-text-secondary block mb-1">Borde redondeado</label>
                                <div className="flex items-center gap-3">
                                    <input type="range" min="0" max="32" step="2" value={styles.pageImageRadius ?? 0}
                                        onChange={(e) => updateStyles({ pageImageRadius: Number(e.target.value) })}
                                        className="flex-1 accent-[var(--arbo-accent)]" />
                                    <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.pageImageRadius ?? 0}px</span>
                                </div>
                            </div>
                        )}

                        <p className="text-[9px] arbo-text-muted italic">
                            {gridOn
                                ? <>Arrastrá/redimensioná el bloque <b>Imagen</b> en el lienzo para posicionarla libremente.</>
                                : <>La imagen cubre el fondo de la página; usá el encuadre para reposicionarla. En diseño libre podés además moverla como bloque.</>}
                        </p>
                    </>
                )}
            </Collapsible>

            {/* Layout */}
            <Collapsible title={t("editor.pageTab.layoutAndSize")} defaultOpen={false}>
                {/* Card Size — managed by the grid when free layout is on */}
                {!gridOn && (
                    <div>
                        <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.formSize")}</label>
                        <div className="grid grid-cols-4 gap-1">
                            {CARD_SIZES.map((size) => (
                                <button key={size.value} onClick={() => updateStyles({ cardSize: size.value as any })}
                                    className={`px-1 py-1.5 rounded-md text-[9px] font-medium transition-colors ${(styles.cardSize || "md") === size.value ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>{size.label}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Border Radius */}
                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.borderRadius")}</label>
                    <div className="flex items-center gap-3">
                        <input type="range" min="0" max="24" step="2" value={styles.borderRadius ?? 14} onChange={(e) => updateStyles({ borderRadius: Number(e.target.value) })} className="flex-1 accent-[var(--arbo-accent)]" />
                        <span className="text-[10px] arbo-text-muted font-mono w-8 text-right">{styles.borderRadius ?? 14}px</span>
                    </div>
                </div>

                {/* Shadow */}
                <div>
                    <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.shadow")}</label>
                    <div className="grid grid-cols-5 gap-1">
                        {SHADOW_OPTIONS.map((opt) => (
                            <button key={opt.value} onClick={() => updateStyles({ shadowStyle: opt.value as any })}
                                className={`px-1 py-1.5 rounded-md text-[9px] font-medium transition-colors ${(styles.shadowStyle || "md") === opt.value ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>{opt.label}</button>
                        ))}
                    </div>
                </div>

                {/* Vertical position — managed by the grid when free layout is on */}
                {!gridOn && (
                    <div>
                        <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.verticalPosition")}</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {([
                                { value: "start", label: t("editor.pageTab.top"), align: "items-start pt-1" },
                                { value: "center", label: t("editor.pageTab.center"), align: "items-center" },
                                { value: "end", label: t("editor.pageTab.bottom"), align: "items-end pb-1" },
                            ] as const).map(({ value, label, align }) => {
                                const isActive = (styles.formVerticalAlign || "start") === value;
                                return (
                                    <button key={value} onClick={() => updateStyles({ formVerticalAlign: value })}
                                        className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                                            isActive
                                                ? "bg-[var(--arbo-accent-muted)] border-[var(--arbo-accent)]/40"
                                                : "bg-[var(--arbo-surface-2)] border-[var(--arbo-border)] hover:border-[var(--arbo-border-light)]"
                                        }`}
                                        style={{ border: `1px solid ${isActive ? "var(--arbo-accent)" : "var(--arbo-border)"}` }}
                                    >
                                        <div className={`w-full h-10 rounded bg-[var(--arbo-surface-3)] flex flex-col ${align} px-1.5`}>
                                            <div className="w-full h-2 rounded-sm" style={{
                                                background: isActive ? "var(--arbo-accent)" : "rgba(255,255,255,0.12)",
                                            }} />
                                        </div>
                                        <span className={`text-[9px] font-medium ${isActive ? "text-[var(--arbo-accent)]" : "arbo-text-muted"}`}>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Collapsible>

            {/* Encabezado (título + descripción) — header element */}
            {(
                <Collapsible title={t("editor.pageTab.header")} defaultOpen={false} forceOpen={isSelected("header")}>
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                        <div>
                            <span className="text-xs arbo-text">{t("editor.pageTab.titleAndDesc")}</span>
                            <p className="text-[9px] arbo-text-muted mt-0.5">{t("editor.pageTab.cardAboveForm")}</p>
                        </div>
                        <button onClick={() => updateStyles({ cardHeaderEnabled: !(styles.cardHeaderEnabled ?? true) })}
                            className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${(styles.cardHeaderEnabled ?? true) ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}>
                            <div className={`size-4 rounded-full bg-white transition-transform ${(styles.cardHeaderEnabled ?? true) ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                    </div>
                </Collapsible>
            )}

            {/* Título de página — heading element */}
            {(
                <Collapsible title="Título de página" defaultOpen={false} forceOpen={isSelected("heading")}>
                    <PageHeadingSettings />
                </Collapsible>
            )}

            {/* Contacto — contact element */}
            {(
                <Collapsible title={t("editor.formStyles.contact")} defaultOpen={false} forceOpen={isSelected("contact")}>
                    <ContactPanelSettings />
                </Collapsible>
            )}

            {/* Logo — logo element */}
            {(
            <Collapsible title="Logo" defaultOpen={false} forceOpen={isSelected("logo")}>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <div>
                        <span className="text-xs arbo-text">Mostrar logo</span>
                        <p className="text-[9px] arbo-text-muted mt-0.5">Se muestra arriba de la página; en diseño libre podés posicionarlo donde quieras</p>
                    </div>
                    <button onClick={() => updateStyles({ logoEnabled: !(styles.logoEnabled ?? true) })}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${(styles.logoEnabled ?? true) ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}>
                        <div className={`size-4 rounded-full bg-white transition-transform ${(styles.logoEnabled ?? true) ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
                {(styles.logoEnabled ?? true) && (
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] arbo-text-secondary">URL del logo (opcional)</label>
                        <input
                            type="url"
                            value={styles.logoUrl || ""}
                            onChange={(e) => updateStyles({ logoUrl: e.target.value })}
                            placeholder="https://…/logo.png"
                            className="w-full px-2 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs outline-none focus:border-[var(--arbo-accent)]"
                        />
                        <p className="text-[9px] arbo-text-muted italic">Dejá vacío para usar el logo de Arbo.</p>
                    </div>
                )}
            </Collapsible>
            )}

            {/* Luces de fondo */}
            <Collapsible title={t("editor.pageTab.bgLights")} defaultOpen={false}>
                <div className="flex items-center justify-between">
                    <p className="text-[9px] arbo-text-muted">{t("editor.pageTab.clickToAdd")}</p>
                    <button
                        onClick={() => {
                            // Turning lights on with no orbs seeds one light from the active theme's accent,
                            // so the current theme stays visible with a glow on top.
                            if (!glowOn && orbs.length === 0) {
                                const accent = styles.accentColor || "#4ADE80";
                                updateStyles({
                                    pageGlowEnabled: true,
                                    pageGlowOrbs: [{ id: crypto.randomUUID(), x: 30, y: 25, size: 70, opacity: 45, color: accent }],
                                });
                            } else {
                                updateStyles({ pageGlowEnabled: !glowOn });
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
                            ref={glowPreviewRef}
                            className="relative rounded-lg overflow-hidden border border-[var(--arbo-border)] select-none"
                            style={{ height: 120, background: getPageBgCss(styles), cursor: draggingGlowId ? "grabbing" : "crosshair" }}
                            onClick={handlePreviewClick}
                        >
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-2/5 h-14 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                            </div>
                            {orbs.map((orb) => (
                                <div key={orb.id} className="absolute flex items-center justify-center"
                                    style={{ left: `${orb.x}%`, top: `${orb.y}%`, transform: "translate(-50%, -50%)", width: 18, height: 18, cursor: "grab", zIndex: 10 }}
                                    onMouseDown={(e) => startOrbDrag(e, orb.id)}>
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
        </div>
    );
};

// ─── Page heading settings ───
const PageHeadingSettings = () => {
    const { t } = useTranslation();
    const { styles, updateStyles } = useEditorContext();
    const headingEnabled = styles.pageHeadingEnabled ?? false;
    const headingAlign = styles.pageHeadingAlign || "center";
    const headingSize = styles.pageHeadingSize || "md";
    const headingColor = styles.pageHeadingColor || "#ffffff";

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                <div>
                    <span className="text-xs arbo-text">{t("editor.pageTab.showTitle")}</span>
                    <p className="text-[9px] arbo-text-muted mt-0.5">{t("editor.pageTab.titleAboveForm")}</p>
                </div>
                <button onClick={() => updateStyles({ pageHeadingEnabled: !headingEnabled })}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${headingEnabled ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}>
                    <div className={`size-4 rounded-full bg-white transition-transform ${headingEnabled ? "translate-x-4" : "translate-x-0"}`} />
                </button>
            </div>

            {headingEnabled && (
                <div className="flex flex-col gap-3">
                    {/* Preview */}
                    <div className="rounded-lg p-3 border border-[var(--arbo-border)]" style={{ background: styles.pageBgColor || "#0f0f14" }}>
                        <p className={`font-bold ${getPageHeadingSizeClass(headingSize)} transition-all`}
                            style={{ color: headingColor, textAlign: headingAlign }}>
                            {styles.pageHeadingText || t("editor.pageTab.yourTitleHere")}
                        </p>
                    </div>

                    {/* Alignment */}
                    <div>
                        <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.alignment")}</label>
                        <div className="grid grid-cols-3 gap-1">
                            {([
                                { value: "left", label: t("editor.pageTab.alignLeft") },
                                { value: "center", label: t("editor.pageTab.alignCenter") },
                                { value: "right", label: t("editor.pageTab.alignRight") },
                            ] as const).map(({ value, label }) => (
                                <button key={value} onClick={() => updateStyles({ pageHeadingAlign: value })}
                                    className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                                        headingAlign === value
                                            ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]"
                                            : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"
                                    }`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size */}
                    <div>
                        <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.headingSize")}</label>
                        <div className="grid grid-cols-4 gap-1">
                            {PAGE_HEADING_SIZES.map((s) => (
                                <button key={s.value} onClick={() => updateStyles({ pageHeadingSize: s.value as any })}
                                    className={`px-1 py-1.5 rounded-md text-[9px] font-medium transition-colors ${
                                        headingSize === s.value
                                            ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]"
                                            : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"
                                    }`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-[10px] arbo-text-secondary block mb-1">{t("editor.pageTab.headingColor")}</label>
                        <div className="flex items-center gap-2">
                            <input type="color" value={headingColor}
                                onChange={(e) => updateStyles({ pageHeadingColor: e.target.value })}
                                className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
                            <span className="text-[9px] arbo-text-muted font-mono">{headingColor}</span>
                            {styles.pageHeadingColor && (
                                <button onClick={() => updateStyles({ pageHeadingColor: undefined })}
                                    className="text-[9px] arbo-text-muted hover:text-[var(--arbo-accent)]">{t("common.reset")}</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
