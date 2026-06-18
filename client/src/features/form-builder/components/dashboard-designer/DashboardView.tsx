// ─── Read-only render of a saved dashboard design with real data ───

import { useEffect, useRef, useState } from "react";
import type { DashboardDesign, DesignerField } from "./types";
import { ROW_H, getDashboardBgCss } from "./types";
import { WidgetContent } from "./WidgetContent";
import type { ResponseLike } from "./aggregations";

interface Props {
    design: DashboardDesign;
    fields: DesignerField[];
    responses: ResponseLike[];
}

export const DashboardView = ({ design, fields, responses }: Props) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [cw, setCw] = useState(0);
    const fieldsMap = new Map(fields.map((f) => [f.name, f]));

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? 0;
            if (w) setCw(w / design.cols);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [design.cols]);

    const pageH = ROW_H * design.rows;
    const ready = cw > 0;

    return (
        <div ref={wrapRef} className="relative w-full rounded-xl overflow-hidden" style={{ height: pageH, background: getDashboardBgCss(design) }}>
            {ready && design.widgets.map((w) => {
                const field = w.fieldName ? fieldsMap.get(w.fieldName) : undefined;
                const bare = w.kind === "title" || w.kind === "text";
                return (
                    <div
                        key={w.id}
                        className="absolute rounded-xl overflow-hidden"
                        style={{
                            left: w.x * cw + 4,
                            top: w.y * ROW_H + 4,
                            width: w.w * cw - 8,
                            height: w.h * ROW_H - 8,
                            background: bare ? "transparent" : "#12122080",
                            border: bare ? "none" : "1px solid #ffffff0f",
                            backdropFilter: bare ? undefined : "blur(8px)",
                            padding: bare ? "0 10px" : 10,
                        }}
                    >
                        <WidgetContent widget={w} field={field} responses={responses} />
                    </div>
                );
            })}
        </div>
    );
};
