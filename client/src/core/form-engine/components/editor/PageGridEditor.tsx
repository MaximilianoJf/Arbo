/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useRef, useState } from "react";
import { Grip, Eye, EyeSlash, Display, Smartphone, Square, Minus, Star, Font, Picture } from "@gravity-ui/icons";
import type { PageElementKey, PageLayout, PageLayoutItem, PageBreakpoint, PageDecor, PageDecorKind } from "../../types";
import {
    normalizePageLayout, pageLayoutHeight, getPageBgCss, applyAlpha, getTransitionSpeed, getLayoutItems,
} from "../../utils/style-helpers";
import { useEditorContext } from "./EditorContext";
import { HeadingPreview, HeaderPreview, ContactPreview, FormPreview, FooterPreview, LogoPreview, ImagePreview } from "./PageElements";
import { PageDecorView } from "../PageDecorView";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Reference viewport widths — the canvas renders the page at this real width and scales it to fit,
// so what you see is exactly what gets published.
const VIEWPORT_W: Record<PageBreakpoint, number> = { desktop: 1280, tablet: 768, mobile: 390 };
const GRID_MAX_W = 1024;   // matches max-w-5xl in the published page
const PAGE_PAD_X = 16;     // px-4
const PAGE_PAD_Y = 32;     // py-8

const ELEMENTS: { key: PageElementKey; label: string; color: string }[] = [
    { key: "logo", label: "Logo", color: "#EC4899" },
    { key: "image", label: "Imagen", color: "#14B8A6" },
    { key: "heading", label: "Encabezado de página", color: "#3B82F6" },
    { key: "header", label: "Título / Descripción", color: "#06B6D4" },
    { key: "contact", label: "Contacto", color: "#8B5CF6" },
    { key: "form", label: "Formulario", color: "#4ADE80" },
    { key: "footer", label: "Pie (Arbo Forms)", color: "#F59E0B" },
];

const DECOR_COLOR = "#F472B6";
const DECOR_LABELS: Record<PageDecorKind, string> = {
    rect: "Rectángulo", line: "Línea", icon: "Icono", text: "Texto", image: "Imagen",
};

const HANDLES: { key: string; dirX: -1 | 0 | 1; dirY: -1 | 0 | 1; cursor: string; style: React.CSSProperties }[] = [
    { key: "nw", dirX: -1, dirY: -1, cursor: "nwse-resize", style: { left: -5, top: -5 } },
    { key: "ne", dirX: 1, dirY: -1, cursor: "nesw-resize", style: { right: -5, top: -5 } },
    { key: "se", dirX: 1, dirY: 1, cursor: "nwse-resize", style: { right: -5, bottom: -5 } },
    { key: "sw", dirX: -1, dirY: 1, cursor: "nesw-resize", style: { left: -5, bottom: -5 } },
    { key: "e", dirX: 1, dirY: 0, cursor: "ew-resize", style: { right: -5, top: "50%", transform: "translateY(-50%)" } },
    { key: "w", dirX: -1, dirY: 0, cursor: "ew-resize", style: { left: -5, top: "50%", transform: "translateY(-50%)" } },
    { key: "s", dirX: 0, dirY: 1, cursor: "ns-resize", style: { bottom: -5, left: "50%", transform: "translateX(-50%)" } },
];

const ElementContent = ({ k }: { k: PageElementKey }) => {
    if (k === "heading") return <div className="flex items-center h-full w-full"><HeadingPreview /></div>;
    if (k === "header") return <HeaderPreview />;
    if (k === "contact") return <ContactPreview />;
    if (k === "form") return <FormPreview />;
    if (k === "logo") return <LogoPreview />;
    if (k === "image") return <ImagePreview />;
    return <div className="flex items-center justify-center h-full w-full"><FooterPreview /></div>;
};

type ResizeDir = { dirX: -1 | 0 | 1; dirY: -1 | 0 | 1 };
interface Rect { x: number; y: number; w: number; h: number }

export const PageGridEditor = () => {
    const { styles, updateStyles, selectedPageElement: selected, setSelectedPageElement: setSelected } = useEditorContext();
    const layout: PageLayout = normalizePageLayout(styles.pageLayout);
    const { cols, rowH } = layout;
    const decors = layout.decors || [];

    const [bp, setBp] = useState<PageBreakpoint>("desktop");
    const items = getLayoutItems(layout, bp);

    const refW = VIEWPORT_W[bp];
    const gridW = Math.min(GRID_MAX_W, refW - PAGE_PAD_X * 2);
    const cw = gridW / cols;

    const [clean, setClean] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const outerRef = useRef<HTMLDivElement>(null);

    // Scale the real-width page down to fit the editor panel (true WYSIWYG miniature)
    const [scale, setScale] = useState(1);
    const scaleRef = useRef(1);
    useEffect(() => {
        const el = outerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const avail = (entries[0]?.contentRect.width ?? 0) - 24;   // p-3 padding
            if (avail <= 0) return;
            const s = Math.min(1, avail / refW);
            scaleRef.current = s;
            setScale(s);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [refW]);

    // Measure real (content-grown) block heights so the canvas height matches the published page
    const [measuredH, setMeasuredH] = useState(0);
    const recomputeH = useCallback(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        let maxBottom = 0;
        wrap.querySelectorAll<HTMLElement>("[data-grid-block]").forEach((el) => {
            maxBottom = Math.max(maxBottom, el.offsetTop + el.offsetHeight);
        });
        setMeasuredH(maxBottom);
    }, []);

    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const els = Array.from(wrap.querySelectorAll<HTMLElement>("[data-grid-block]"));
        const ro = new ResizeObserver(() => recomputeH());
        els.forEach((el) => ro.observe(el));
        recomputeH();
        return () => ro.disconnect();
    }, [items, decors, bp, styles, recomputeH]);

    const activeMap: Record<PageElementKey, boolean> = {
        logo: styles.logoEnabled ?? true,
        image: !!styles.pageBgImage,
        heading: !!styles.pageHeadingEnabled,
        header: styles.cardHeaderEnabled !== false,
        contact: styles.contactEnabled ?? false,
        form: true,
        footer: true,
    };

    const commitItems = useCallback((newItems: PageLayoutItem[]) => {
        if (bp === "desktop") updateStyles({ pageLayout: { ...layout, enabled: true, items: newItems } });
        else updateStyles({ pageLayout: { ...layout, enabled: true, [bp]: newItems } });
    }, [layout, updateStyles, bp]);

    const commitDecors = useCallback((newDecors: PageDecor[]) => {
        updateStyles({ pageLayout: { ...layout, enabled: true, decors: newDecors } });
    }, [layout, updateStyles]);

    /** Shared drag/resize loop: converts mouse deltas to grid units (compensating the canvas scale). */
    const trackPointer = useCallback((e: React.MouseEvent, start: Rect, mode: "move" | ResizeDir, apply: (r: Rect) => void) => {
        const sx = e.clientX, sy = e.clientY;
        const onMove = (ev: MouseEvent) => {
            const s = scaleRef.current || 1;
            const dCol = Math.round((ev.clientX - sx) / s / cw);
            const dRow = Math.round((ev.clientY - sy) / s / rowH);
            let { x, y, w, h } = start;
            if (mode === "move") {
                x = clamp(start.x + dCol, 0, cols - start.w);
                y = clamp(start.y + dRow, 0, 300);
            } else {
                if (mode.dirX === 1) w = clamp(start.w + dCol, 1, cols - start.x);
                if (mode.dirX === -1) { const maxLeft = start.x + start.w - 1; x = clamp(start.x + dCol, 0, maxLeft); w = start.w + (start.x - x); }
                if (mode.dirY === 1) h = clamp(start.h + dRow, 1, 300);
                if (mode.dirY === -1) { const maxTop = start.y + start.h - 1; y = clamp(start.y + dRow, 0, maxTop); h = start.h + (start.y - y); }
            }
            apply({ x, y, w, h });
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [cw, rowH, cols]);

    const startItemInteraction = useCallback((e: React.MouseEvent, item: PageLayoutItem, mode: "move" | ResizeDir) => {
        e.preventDefault();
        e.stopPropagation();
        setSelected(item.key);
        trackPointer(e, item, mode, (r) =>
            commitItems(items.map((it) => (it.key === item.key ? { ...it, ...r } : it))));
    }, [items, commitItems, trackPointer, setSelected]);

    const startDecorInteraction = useCallback((e: React.MouseEvent, decor: PageDecor, mode: "move" | ResizeDir) => {
        e.preventDefault();
        e.stopPropagation();
        setSelected(decor.id);
        trackPointer(e, decor, mode, (r) =>
            commitDecors(decors.map((d) => (d.id === decor.id ? { ...d, ...r } : d))));
    }, [decors, commitDecors, trackPointer, setSelected]);

    const addDecor = (kind: PageDecorKind) => {
        const id = `decor_${crypto.randomUUID()}`;
        const base: PageDecor = { id, kind, x: 1, y: 1, w: 4, h: 2, layer: "back" };
        const decor: PageDecor =
            kind === "rect" ? { ...base, bgColor: "#FFFFFF", opacity: 10, radius: 14 } :
            kind === "line" ? { ...base, h: 1, bgColor: "#FFFFFF", borderWidth: 2, opacity: 60 } :
            kind === "icon" ? { ...base, w: 2, h: 2, textColor: styles.accentColor || "#4ADE80", layer: "front" } :
            kind === "text" ? { ...base, h: 1, text: "Texto decorativo", textColor: "#FFFFFF", fontSize: 18, layer: "front" } :
            { ...base, w: 4, h: 4, imageFit: "cover" };   // image
        commitDecors([...decors, decor]);
        setSelected(id);
    };

    // Delete key removes the selected decoration (core elements are toggled, not deleted)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Delete" && e.key !== "Backspace") return;
            const t = e.target as HTMLElement;
            if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
            if (selected && decors.some((d) => d.id === selected)) {
                e.preventDefault();
                commitDecors(decors.filter((d) => d.id !== selected));
                setSelected(null);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selected, decors, commitDecors, setSelected]);

    // A snapped full-bleed image is pinned to the page edge and must not drive the grid height,
    // otherwise anchoring it to the bottom grows the canvas in a feedback loop.
    const imgItem = items.find((it) => it.key === "image");
    const imageSnapped = !!imgItem && imgItem.x === 0 && imgItem.w === cols
        && !!styles.pageImageSnap && styles.pageImageSnap !== "none";
    const heightItems = imageSnapped ? items.filter((it) => it.key !== "image") : items;

    const decorBottom = decors.length ? Math.max(...decors.map((d) => d.y + d.h)) * rowH : 0;
    const gridH = Math.max(pageLayoutHeight(heightItems, rowH), measuredH, decorBottom) + rowH;
    const pageH = gridH + PAGE_PAD_Y * 2;

    const accent = styles.accentColor || "#4ADE80";
    const animVars = {
        "--arbo-transition-speed": getTransitionSpeed(styles),
        "--arbo-hover-glow-color": applyAlpha(accent, 0.35),
        "--arbo-focus-color": applyAlpha(accent, 0.3),
    } as React.CSSProperties;

    const invScale = 1 / (scale || 1);
    const handleEls = (color: string, onDown: (e: React.MouseEvent, dir: ResizeDir) => void) =>
        HANDLES.map((h) => (
            <div
                key={h.key}
                onMouseDown={(e) => onDown(e, { dirX: h.dirX, dirY: h.dirY })}
                className="absolute rounded-full bg-white border-2 z-30"
                style={{
                    ...h.style,
                    width: Math.round(10 * invScale),
                    height: Math.round(10 * invScale),
                    cursor: h.cursor,
                    borderColor: color,
                }}
            />
        ));

    const labelTab = (color: string, label: string, onDown: (e: React.MouseEvent) => void) => (
        <div
            onMouseDown={onDown}
            className="absolute left-0 flex items-center gap-1 px-1.5 h-5 rounded-t-md cursor-move text-white text-[9px] font-semibold whitespace-nowrap z-20"
            style={{ background: color, bottom: "100%", transformOrigin: "bottom left", transform: `scale(${invScale})` }}
            title="Arrastrar para mover"
        >
            <Grip className="size-2.5" /> {label}
        </div>
    );

    /** Selection + drag from the block body, letting form controls keep their clicks. */
    const bodyMouseDown = (key: string, onDrag: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        const el = e.target as HTMLElement;
        if (el.closest("input, textarea, select, button, label, [contenteditable]")) {
            setSelected(key);
            return;
        }
        onDrag(e);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden border border-[var(--arbo-border)]">
            <div className="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-[var(--arbo-border)] flex-wrap" style={{ background: "var(--arbo-surface-3)" }}>
                {/* Breakpoint switcher */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    {([
                        { key: "desktop", label: "PC", icon: <Display className="size-3" /> },
                        { key: "tablet", label: "Tablet", icon: <Display className="size-3" /> },
                        { key: "mobile", label: "Móvil", icon: <Smartphone className="size-3" /> },
                    ] as { key: PageBreakpoint; label: string; icon: React.ReactNode }[]).map((b) => (
                        <button key={b.key} onClick={() => { setBp(b.key); setSelected(null); }}
                            className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${bp === b.key ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "arbo-text-muted hover:arbo-text"}`}>
                            {b.icon}{b.label}
                        </button>
                    ))}
                </div>

                {/* Decoration palette */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <span className="text-[9px] arbo-text-muted px-1 uppercase tracking-wider font-semibold">Adornos</span>
                    {([
                        { kind: "rect", icon: <Square className="size-3" />, title: "Rectángulo" },
                        { kind: "line", icon: <Minus className="size-3" />, title: "Línea" },
                        { kind: "icon", icon: <Star className="size-3" />, title: "Icono" },
                        { kind: "text", icon: <Font className="size-3" />, title: "Texto" },
                        { kind: "image", icon: <Picture className="size-3" />, title: "Imagen decorativa" },
                    ] as { kind: PageDecorKind; icon: React.ReactNode; title: string }[]).map((d) => (
                        <button key={d.kind} onClick={() => addDecor(d.kind)} title={`Agregar ${d.title.toLowerCase()}`}
                            className="flex items-center justify-center size-6 rounded arbo-text-muted hover:text-[var(--arbo-accent)] hover:bg-[var(--arbo-surface-3)] transition-colors cursor-pointer active:scale-90">
                            {d.icon}
                        </button>
                    ))}
                </div>

                {/* Logo toggle — always reachable even when the logo is hidden on the canvas */}
                <button
                    onClick={() => { updateStyles({ logoEnabled: !(styles.logoEnabled ?? true) }); setSelected("logo"); }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer border ${(styles.logoEnabled ?? true) ? "bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)] border-[var(--arbo-accent)]/40" : "bg-[var(--arbo-surface-2)] arbo-text-muted border-[var(--arbo-border)] hover:arbo-text"}`}
                    title={(styles.logoEnabled ?? true) ? "Ocultar logo" : "Mostrar logo"}
                >
                    {(styles.logoEnabled ?? true) ? <Eye className="size-3" /> : <EyeSlash className="size-3" />}
                    Logo
                </button>

                <span className="text-[9px] arbo-text-muted font-mono">{Math.round(scale * 100)}%</span>
                {bp !== "desktop" && !(bp === "tablet" ? layout.tablet : layout.mobile) && (
                    <span className="text-[9px] arbo-text-muted italic">heredado de PC</span>
                )}

                <button
                    onClick={() => { setClean((v) => !v); setSelected(null); }}
                    className={`ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${clean ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)] hover:arbo-text"}`}
                    title="Mostrar/ocultar guías de edición"
                >
                    {clean ? <Eye className="size-3" /> : <EyeSlash className="size-3" />}
                    {clean ? "Mostrar guías" : "Vista limpia"}
                </button>
            </div>

            {/* Scaled true-size page: rendered at the real viewport width, then scaled to fit */}
            <div ref={outerRef} className="flex-1 overflow-auto" style={{ background: "var(--arbo-surface)" }}>
                <div className="flex justify-center p-3">
                    <div style={{ width: refW * scale, height: pageH * scale }}>
                        <div style={{ width: refW, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                            {/* The page itself — same structure as the published view */}
                            <div
                                className="select-none"
                                style={{ background: getPageBgCss(styles), padding: `${PAGE_PAD_Y}px ${PAGE_PAD_X}px`, ...animVars }}
                                onMouseDown={() => setSelected(null)}
                            >
                                <div ref={wrapRef} className="relative mx-auto" style={{ height: gridH, maxWidth: GRID_MAX_W }}>
                                    {/* Grid lines */}
                                    {!clean && (
                                        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                                            {Array.from({ length: cols + 1 }, (_, i) => (
                                                <line key={i} x1={i * cw} y1={0} x2={i * cw} y2={gridH} stroke="#ffffff10" strokeWidth={1} />
                                            ))}
                                        </svg>
                                    )}

                                    {/* Decorations */}
                                    {decors.map((decor) => {
                                        const isSel = selected === decor.id;
                                        return (
                                            <div
                                                key={decor.id}
                                                data-grid-block
                                                onMouseDown={clean ? undefined : bodyMouseDown(decor.id, (e) => startDecorInteraction(e, decor, "move"))}
                                                className={`absolute group ${clean ? "" : "cursor-move"}`}
                                                style={{
                                                    left: decor.x * cw,
                                                    top: decor.y * rowH,
                                                    width: decor.w * cw,
                                                    height: decor.h * rowH,
                                                    zIndex: isSel ? 30 : (decor.layer || "back") === "back" ? 1 : 20,
                                                    outline: clean ? "none" : isSel ? `2px solid ${DECOR_COLOR}` : "1px dashed rgba(255,255,255,0.14)",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                {!clean && isSel && labelTab(DECOR_COLOR, DECOR_LABELS[decor.kind], (e) => startDecorInteraction(e, decor, "move"))}
                                                <PageDecorView decor={decor} />
                                                {!clean && isSel && handleEls(DECOR_COLOR, (e, dir) => startDecorInteraction(e, decor, dir))}
                                            </div>
                                        );
                                    })}

                                    {/* Page elements */}
                                    {items.filter((it) => activeMap[it.key]).map((item) => {
                                        const meta = ELEMENTS.find((e) => e.key === item.key)!;
                                        const isSel = selected === item.key;
                                        const isImage = item.key === "logo" || item.key === "image";
                                        const cellH = item.h * rowH;
                                        // A full-width image breaks out to cover the whole page width (full-bleed)
                                        const fullBleed = item.key === "image" && item.x === 0 && item.w === cols;
                                        // Snap pulls the full-bleed image past the page padding to the screen edge
                                        const snapTop = fullBleed && styles.pageImageSnap === "top" ? -PAGE_PAD_Y
                                            : fullBleed && styles.pageImageSnap === "bottom" ? gridH + PAGE_PAD_Y - cellH
                                            : item.y * rowH;
                                        const isSnapped = item.key === "image" && imageSnapped;
                                        return (
                                            <div
                                                key={item.key}
                                                // Snapped images are excluded from the height measurement (see gridH above)
                                                {...(isSnapped ? {} : { "data-grid-block": true })}
                                                onMouseDown={clean ? undefined : bodyMouseDown(item.key, (e) => startItemInteraction(e, item, "move"))}
                                                className={`absolute group ${clean ? "" : "cursor-move"}`}
                                                style={{
                                                    left: fullBleed ? -(refW - gridW) / 2 : item.x * cw,
                                                    top: snapTop,
                                                    width: fullBleed ? refW : item.w * cw,
                                                    ...(isImage ? { height: cellH } : { minHeight: cellH }),
                                                    zIndex: isSel ? 30 : item.key === "image" ? 0 : 10,
                                                    outline: clean ? "none" : isSel ? `2px solid ${meta.color}` : "1px dashed rgba(255,255,255,0.18)",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                {!clean && labelTab(meta.color, meta.label, (e) => startItemInteraction(e, item, "move"))}
                                                <div className={`${fullBleed ? "" : "p-1"} ${isImage ? "h-full" : ""}`}>
                                                    <ElementContent k={item.key} />
                                                </div>
                                                {!clean && isSel && handleEls(meta.color, (e, dir) => startItemInteraction(e, item, dir))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
