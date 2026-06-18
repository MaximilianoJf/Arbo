import { useEffect, useRef, useState, useCallback } from "react";
import type { PdfBlock, PdfDesign, DesignerField } from "./types";
import { clamp, computeQuestionNumbers, META_LABELS } from "./types";
import { PDF_ICONS } from "./icons";

const META_SAMPLE: Record<string, string> = {
    name: "Nombre Apellido",
    email: "correo@ejemplo.com",
    date: "01/01/2026 10:00",
};

// A4 content area in points (matches the PDF backend: 595.28 - 2*40 wide, 841.89 - 2*40 tall)
const CONTENT_W_PT = 515.28;
const CONTENT_H_PT = 761.89;

interface DesignerCanvasProps {
    design: PdfDesign;
    fields: DesignerField[];
    formTitle: string;
    selectedIds: string[];
    primaryId: string | null;
    onSelect: (id: string | null, additive: boolean) => void;
    onChange: (id: string, patch: Partial<PdfBlock>) => void;
    onUpdatePositions: (updates: { id: string; x: number; y: number }[]) => void;
}

const HANDLES: { key: string; dirX: -1 | 0 | 1; dirY: -1 | 0 | 1; cursor: string; style: React.CSSProperties }[] = [
    { key: "nw", dirX: -1, dirY: -1, cursor: "nwse-resize", style: { left: -4, top: -4 } },
    { key: "n", dirX: 0, dirY: -1, cursor: "ns-resize", style: { left: "50%", top: -4, transform: "translateX(-50%)" } },
    { key: "ne", dirX: 1, dirY: -1, cursor: "nesw-resize", style: { right: -4, top: -4 } },
    { key: "e", dirX: 1, dirY: 0, cursor: "ew-resize", style: { right: -4, top: "50%", transform: "translateY(-50%)" } },
    { key: "se", dirX: 1, dirY: 1, cursor: "nwse-resize", style: { right: -4, bottom: -4 } },
    { key: "s", dirX: 0, dirY: 1, cursor: "ns-resize", style: { left: "50%", bottom: -4, transform: "translateX(-50%)" } },
    { key: "sw", dirX: -1, dirY: 1, cursor: "nesw-resize", style: { left: -4, bottom: -4 } },
    { key: "w", dirX: -1, dirY: 0, cursor: "ew-resize", style: { left: -4, top: "50%", transform: "translateY(-50%)" } },
];

// ─── Block content preview (scaled to PDF points so it matches the export) ───
const BlockContent = ({ block, field, formTitle, scale, qNumber }: { block: PdfBlock; field?: DesignerField; formTitle: string; scale: number; qNumber?: number }) => {
    const labelColor = block.labelColor || "#6B7280";
    const textColor = block.textColor || "#111827";
    const align = (block.align || "left") as any;
    const px = (pt: number) => `${pt * scale}px`;

    const fontStyle = block.italic ? "italic" : "normal";
    const textDecoration = block.underline ? "underline" : "none";

    if (block.kind === "title") {
        return <div style={{ color: textColor, textAlign: align, fontWeight: block.bold === false ? 400 : 700, fontStyle, textDecoration, fontSize: px(block.fontSize || 18), lineHeight: 1.1 }} className="truncate">{formTitle || "Título del formulario"}</div>;
    }

    // Shape: rectangle (wrapper bg/border draws it) or horizontal line
    if (block.kind === "shape") {
        if (block.shape === "line") {
            const color = block.bgColor || block.borderColor || "#111827";
            const th = Math.max(1, (block.borderWidth || 2) * scale);
            return <div className="w-full h-full flex items-center"><div style={{ width: "100%", height: th, background: color, borderRadius: th / 2 }} /></div>;
        }
        return null;
    }

    // Icon
    if (block.kind === "icon") {
        const def = PDF_ICONS[block.iconId || "star"] || PDF_ICONS.star;
        const color = textColor;
        return (
            <svg viewBox="0 0 24 24" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                <path d={def.path} fill={def.mode === "fill" ? color : "none"} stroke={def.mode === "stroke" ? color : "none"} strokeWidth={def.mode === "stroke" ? 2 : 0} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    // Combined meta (legacy, no metaField) — full box with 3 lines
    if (block.kind === "meta" && !block.metaField) {
        const fs = px(block.fontSize || 9);
        return (
            <div style={{ color: textColor }} className="flex flex-col">
                <span style={{ fontSize: fs, lineHeight: 1.4 }} className="truncate">Respondente: Nombre Apellido</span>
                <span style={{ fontSize: fs, lineHeight: 1.4 }} className="truncate">Email: correo@ejemplo.com</span>
                <span style={{ fontSize: fs, lineHeight: 1.4 }} className="truncate">Enviado: 01/01/2026 10:00</span>
            </div>
        );
    }
    if (block.kind === "text") {
        return <div style={{ color: textColor, textAlign: align, fontWeight: block.bold ? 700 : 400, fontStyle, textDecoration, fontSize: px(block.fontSize || 11), lineHeight: 1.3 }} className="whitespace-pre-wrap break-words">{block.text || "Texto personalizado"}</div>;
    }

    // field OR single meta-field — label + value
    const isMeta = block.kind === "meta";
    const showLabel = block.showLabel !== false;
    const labelLeft = (block.labelPos || "top") === "left";
    const rawLabel = isMeta ? META_LABELS[block.metaField!] : (field?.label || field?.name || "Campo");
    const labelText = !isMeta && qNumber ? `${qNumber}. ${rawLabel}` : rawLabel;
    const valueText = isMeta ? META_SAMPLE[block.metaField!] : "Respuesta…";
    return (
        <div className={`flex min-w-0 ${labelLeft ? "flex-row items-baseline" : "flex-col"}`} style={{ gap: px(labelLeft ? 6 : 2) }}>
            {showLabel && (
                <span style={{ color: labelColor, fontSize: px(8), fontWeight: 700, lineHeight: 1.2 }} className={labelLeft ? "shrink-0 max-w-[45%] truncate" : "truncate"}>
                    {labelText}
                </span>
            )}
            <span style={{ color: textColor, textAlign: align, fontWeight: block.bold ? 700 : 400, fontStyle, textDecoration, fontSize: px(block.fontSize || 10), lineHeight: 1.2 }} className={`truncate flex-1 min-w-0 ${isMeta ? "" : "opacity-70"}`}>
                {valueText}
            </span>
        </div>
    );
};

export const DesignerCanvas = ({ design, fields, formTitle, selectedIds, primaryId, onSelect, onChange, onUpdatePositions }: DesignerCanvasProps) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ cw: 0, ch: 0, scale: 0 });
    const cwRef = useRef(0);
    const chRef = useRef(0);

    // Measure width → derive pt-to-px scale and cell sizes (non-square, matches A4 content area)
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? 0;
            if (!w) return;
            const scale = w / CONTENT_W_PT;
            const cw = w / design.cols;
            const ch = (CONTENT_H_PT * scale) / design.rows;
            cwRef.current = cw;
            chRef.current = ch;
            setDims({ cw, ch, scale });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [design.cols, design.rows]);

    // Scroll the primary (last-selected) block into view
    useEffect(() => {
        if (!primaryId) return;
        const el = wrapRef.current?.querySelector(`[data-block-id="${primaryId}"]`) as HTMLElement | null;
        el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }, [primaryId]);

    const fieldsMap = useRef<Map<string, DesignerField>>(new Map());
    fieldsMap.current = new Map(fields.map((f) => [f.name, f]));

    // Mouse down on a block body: handle selection (shift = toggle) then group-drag
    const onBlockMouseDown = useCallback((e: React.MouseEvent, block: PdfBlock) => {
        e.preventDefault();
        e.stopPropagation();

        // Shift-click toggles selection without dragging
        if (e.shiftKey) { onSelect(block.id, true); return; }

        const already = selectedIds.includes(block.id);
        if (!already) onSelect(block.id, false);
        const dragIds = already ? selectedIds : [block.id];

        const cw = cwRef.current || 1;
        const ch = chRef.current || 1;
        const sx = e.clientX, sy = e.clientY;
        const starts = design.blocks
            .filter((b) => dragIds.includes(b.id))
            .map((b) => ({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h }));

        const onMove = (ev: MouseEvent) => {
            const dCol = Math.round((ev.clientX - sx) / cw);
            const dRow = Math.round((ev.clientY - sy) / ch);
            onUpdatePositions(starts.map((s) => ({
                id: s.id,
                x: clamp(s.x + dCol, 0, design.cols - s.w),
                y: clamp(s.y + dRow, 0, design.rows - s.h),
            })));
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [design.blocks, design.cols, design.rows, selectedIds, onSelect, onUpdatePositions]);

    // Resize a single block from a handle
    const startResize = useCallback((e: React.MouseEvent, block: PdfBlock, dirX: -1 | 0 | 1, dirY: -1 | 0 | 1) => {
        e.preventDefault();
        e.stopPropagation();
        const cw = cwRef.current || 1;
        const ch = chRef.current || 1;
        const sx = e.clientX, sy = e.clientY;
        const s = { x: block.x, y: block.y, w: block.w, h: block.h };
        const onMove = (ev: MouseEvent) => {
            const dCol = Math.round((ev.clientX - sx) / cw);
            const dRow = Math.round((ev.clientY - sy) / ch);
            let nx = s.x, ny = s.y, nw = s.w, nh = s.h;
            if (dirX === 1) nw = clamp(s.w + dCol, 1, design.cols - s.x);
            if (dirX === -1) { const maxLeft = s.x + s.w - 1; nx = clamp(s.x + dCol, 0, maxLeft); nw = s.w + (s.x - nx); }
            if (dirY === 1) nh = clamp(s.h + dRow, 1, design.rows - s.y);
            if (dirY === -1) { const maxTop = s.y + s.h - 1; ny = clamp(s.y + dRow, 0, maxTop); nh = s.h + (s.y - ny); }
            onChange(block.id, { x: nx, y: ny, w: nw, h: nh });
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [design.cols, design.rows, onChange]);

    const { cw, ch, scale } = dims;
    const pageH = ch * design.rows;
    const ready = cw > 0 && ch > 0;
    const qNumbers = design.numberQuestions ? computeQuestionNumbers(design.blocks) : null;

    return (
        <div
            ref={wrapRef}
            className="relative w-full select-none rounded-md overflow-hidden shadow-inner border border-black/10"
            style={{ height: pageH || undefined, background: design.pageBg || "#FFFFFF", aspectRatio: ready ? undefined : `${CONTENT_W_PT} / ${CONTENT_H_PT}` }}
            onMouseDown={() => onSelect(null, false)}
        >
            {/* Grid lines */}
            {ready && (
                <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                    {Array.from({ length: design.cols + 1 }, (_, i) => (
                        <line key={`v${i}`} x1={i * cw} y1={0} x2={i * cw} y2={pageH} stroke="#00000010" strokeWidth={1} />
                    ))}
                    {Array.from({ length: design.rows + 1 }, (_, i) => (
                        <line key={`h${i}`} x1={0} y1={i * ch} x2={design.cols * cw} y2={i * ch} stroke="#00000010" strokeWidth={1} />
                    ))}
                </svg>
            )}

            {/* Blocks */}
            {ready && design.blocks.map((block) => {
                const selected = selectedIds.includes(block.id);
                const showHandles = selected && selectedIds.length === 1;
                const field = block.fieldName ? fieldsMap.current.get(block.fieldName) : undefined;
                const isLine = block.kind === "shape" && block.shape === "line";
                const bw = (block.borderWidth || 1) * (scale || 1);
                const aidBorder = !block.borderColor && !(block.kind === "shape" && block.bgColor) && block.kind !== "icon";
                const borderCss = selected
                    ? "1px solid #4ADE80"
                    : block.borderColor
                        ? `${bw}px solid ${block.borderColor}`
                        : aidBorder ? "1px dashed #D1D5DB" : "1px solid transparent";
                return (
                    <div
                        key={block.id}
                        data-block-id={block.id}
                        onMouseDown={(e) => onBlockMouseDown(e, block)}
                        className="absolute overflow-hidden"
                        style={{
                            left: block.x * cw,
                            top: block.y * ch,
                            width: block.w * cw,
                            height: block.h * ch,
                            background: isLine ? "transparent" : (block.bgColor || "transparent"),
                            border: borderCss,
                            borderRadius: 3 * (scale || 1),
                            boxShadow: selected ? "0 0 0 2px rgba(74,222,128,0.35)" : undefined,
                            cursor: "move",
                            padding: (block.kind === "icon" ? 2 : 4) * (scale || 1),
                            zIndex: selected ? 20 : 10,
                        }}
                    >
                        <BlockContent block={block} field={field} formTitle={formTitle} scale={scale || 1} qNumber={qNumbers?.get(block.id)} />

                        {showHandles && HANDLES.map((h) => (
                            <div
                                key={h.key}
                                onMouseDown={(e) => startResize(e, block, h.dirX, h.dirY)}
                                className="absolute size-2 rounded-full bg-white border-2 border-[#4ADE80] z-30"
                                style={{ ...h.style, cursor: h.cursor }}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};
