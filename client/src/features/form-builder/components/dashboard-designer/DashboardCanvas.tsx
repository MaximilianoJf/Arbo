// ─── Editable dashboard grid: drag to move, handles to resize ───
// Grid model mirrors the proven PDF DesignerCanvas: column width derives from
// the measured container, row height is fixed (ROW_H).

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardDesign, DashWidget, DesignerField } from "./types";
import { clamp, ROW_H, getDashboardBgCss } from "./types";
import { WidgetContent } from "./WidgetContent";
import type { ResponseLike } from "./aggregations";

interface Props {
    design: DashboardDesign;
    fields: DesignerField[];
    responses: ResponseLike[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onChange: (id: string, patch: Partial<DashWidget>) => void;
}

const HANDLES: { key: string; dirX: -1 | 0 | 1; dirY: -1 | 0 | 1; cursor: string; style: React.CSSProperties }[] = [
    { key: "se", dirX: 1, dirY: 1, cursor: "nwse-resize", style: { right: -5, bottom: -5 } },
    { key: "e", dirX: 1, dirY: 0, cursor: "ew-resize", style: { right: -5, top: "50%", transform: "translateY(-50%)" } },
    { key: "s", dirX: 0, dirY: 1, cursor: "ns-resize", style: { left: "50%", bottom: -5, transform: "translateX(-50%)" } },
];

export const DashboardCanvas = ({ design, fields, responses, selectedId, onSelect, onChange }: Props) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [cw, setCw] = useState(0);
    const cwRef = useRef(0);
    const fieldsMap = useRef<Map<string, DesignerField>>(new Map());
    fieldsMap.current = new Map(fields.map((f) => [f.name, f]));

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? 0;
            if (!w) return;
            const next = w / design.cols;
            cwRef.current = next;
            setCw(next);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [design.cols]);

    const startDrag = useCallback((e: React.MouseEvent, w: DashWidget) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(w.id);
        const cellW = cwRef.current || 1;
        const sx = e.clientX, sy = e.clientY;
        const s = { x: w.x, y: w.y };
        const onMove = (ev: MouseEvent) => {
            const dCol = Math.round((ev.clientX - sx) / cellW);
            const dRow = Math.round((ev.clientY - sy) / ROW_H);
            onChange(w.id, {
                x: clamp(s.x + dCol, 0, design.cols - w.w),
                y: clamp(s.y + dRow, 0, design.rows - w.h),
            });
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [design.cols, design.rows, onSelect, onChange]);

    const startResize = useCallback((e: React.MouseEvent, w: DashWidget, dirX: -1 | 0 | 1, dirY: -1 | 0 | 1) => {
        e.preventDefault();
        e.stopPropagation();
        const cellW = cwRef.current || 1;
        const sx = e.clientX, sy = e.clientY;
        const s = { w: w.w, h: w.h };
        const onMove = (ev: MouseEvent) => {
            const dCol = Math.round((ev.clientX - sx) / cellW);
            const dRow = Math.round((ev.clientY - sy) / ROW_H);
            const patch: Partial<DashWidget> = {};
            if (dirX === 1) patch.w = clamp(s.w + dCol, 1, design.cols - w.x);
            if (dirY === 1) patch.h = clamp(s.h + dRow, 1, design.rows - w.y);
            onChange(w.id, patch);
        };
        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }, [design.cols, design.rows, onChange]);

    const pageH = ROW_H * design.rows;
    const ready = cw > 0;

    return (
        <div
            ref={wrapRef}
            className="relative w-full select-none rounded-xl overflow-hidden border border-white/10"
            style={{ height: pageH, background: getDashboardBgCss(design) }}
            onMouseDown={() => onSelect(null)}
        >
            {/* Grid lines */}
            {ready && (
                <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                    {Array.from({ length: design.cols + 1 }, (_, i) => (
                        <line key={`v${i}`} x1={i * cw} y1={0} x2={i * cw} y2={pageH} stroke="#ffffff0a" strokeWidth={1} />
                    ))}
                    {Array.from({ length: design.rows + 1 }, (_, i) => (
                        <line key={`h${i}`} x1={0} y1={i * ROW_H} x2={design.cols * cw} y2={i * ROW_H} stroke="#ffffff0a" strokeWidth={1} />
                    ))}
                </svg>
            )}

            {/* Widgets */}
            {ready && design.widgets.map((w) => {
                const selected = selectedId === w.id;
                const field = w.fieldName ? fieldsMap.current.get(w.fieldName) : undefined;
                const bare = w.kind === "title" || w.kind === "text";
                return (
                    <div
                        key={w.id}
                        onMouseDown={(e) => startDrag(e, w)}
                        className="absolute rounded-xl overflow-hidden transition-shadow"
                        style={{
                            left: w.x * cw + 4,
                            top: w.y * ROW_H + 4,
                            width: w.w * cw - 8,
                            height: w.h * ROW_H - 8,
                            background: bare ? "transparent" : "#12122080",
                            border: selected ? `1px solid ${design.accent || "#4ADE80"}` : bare ? "1px solid transparent" : "1px solid #ffffff0f",
                            boxShadow: selected ? `0 0 0 2px ${design.accent || "#4ADE80"}55` : undefined,
                            backdropFilter: bare ? undefined : "blur(8px)",
                            cursor: "move",
                            padding: bare ? "0 10px" : 10,
                            zIndex: selected ? 20 : 10,
                        }}
                    >
                        <WidgetContent widget={w} field={field} responses={responses} />

                        {selected && HANDLES.map((h) => (
                            <div
                                key={h.key}
                                onMouseDown={(e) => startResize(e, w, h.dirX, h.dirY)}
                                className="absolute size-2.5 rounded-full bg-white border-2 z-30"
                                style={{ ...h.style, cursor: h.cursor, borderColor: design.accent || "#4ADE80" }}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};
