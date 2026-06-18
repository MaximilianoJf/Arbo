import { useRef, useState } from "react";
import { FieldError } from "@heroui/react";
import { Pencil, Font, TrashBin } from "@gravity-ui/icons";
import type { FormField } from "../../types";

interface DynamicSignatureProps extends FormField {
    handleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    formState: Record<string, { value: string | number; error: string | null }>;
}

type Pt = { x: number; y: number };

// Logical drawing space (the SVG scales to fit its container)
const W = 600;
const H = 180;
const INK = "#111827";

/** Smooth a stroke into an SVG path using quadratic curves through midpoints. */
const strokeToPath = (pts: Pt[]): string => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} l 0.1 0`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1], cur = pts[i];
        d += ` Q ${prev.x} ${prev.y} ${(prev.x + cur.x) / 2} ${(prev.y + cur.y) / 2}`;
    }
    return d;
};

const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const toDataUrl = (inner: string): string =>
    `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${inner}</svg>`)}`;

const drawSvg = (strokes: Pt[][]): string =>
    toDataUrl(strokes.filter((s) => s.length).map((s) =>
        `<path d="${strokeToPath(s)}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`).join(""));

const textSvg = (text: string): string =>
    toDataUrl(`<text x="50%" y="62%" text-anchor="middle" font-family="'Segoe Script','Brush Script MT','Lucida Handwriting',cursive" font-size="${Math.round(H * 0.45)}" fill="${INK}">${xmlEscape(text)}</text>`);

const SIGN_FONT = "'Segoe Script','Brush Script MT','Lucida Handwriting',cursive";

export const DynamicSignature = ({ name, label, formState, required, className, handleInputChange }: DynamicSignatureProps) => {
    const state = formState[name] ?? { value: "", error: null };
    const error = state.error;

    const [mode, setMode] = useState<"draw" | "type">("draw");
    const [typed, setTyped] = useState("");
    const strokesRef = useRef<Pt[][]>([]);
    const [, setTick] = useState(0);
    const redraw = () => setTick((t) => t + 1);
    const drawing = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);

    const commit = (value: string) => handleInputChange?.({ target: { name, value } } as React.ChangeEvent<HTMLInputElement>);

    const ptFromEvent = (e: React.PointerEvent): Pt => {
        const rect = svgRef.current!.getBoundingClientRect();
        return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
    };

    const onDown = (e: React.PointerEvent) => {
        if (mode !== "draw") return;
        e.preventDefault();
        drawing.current = true;
        svgRef.current?.setPointerCapture(e.pointerId);
        strokesRef.current.push([ptFromEvent(e)]);
        redraw();
    };
    const onMove = (e: React.PointerEvent) => {
        if (!drawing.current) return;
        strokesRef.current[strokesRef.current.length - 1].push(ptFromEvent(e));
        redraw();
    };
    const onUp = () => {
        if (!drawing.current) return;
        drawing.current = false;
        commit(drawSvg(strokesRef.current));
    };

    const clear = () => {
        strokesRef.current = [];
        setTyped("");
        commit("");
        redraw();
    };

    const onTyped = (v: string) => {
        setTyped(v);
        commit(v.trim() ? textSvg(v) : "");
    };

    const hasContent = mode === "draw" ? strokesRef.current.some((s) => s.length) : !!typed.trim();

    return (
        <div className={`flex flex-col gap-1.5 ${className || ""}`}>
            {label && (
                <span className="text-sm font-medium" style={{ color: "var(--field-label-color, var(--arbo-text))" }}>
                    {label}{required && <span className="text-[var(--arbo-danger)]"> *</span>}
                </span>
            )}

            {/* Mode tabs + clear */}
            <div className="flex items-center gap-1">
                <button type="button" onClick={() => setMode("draw")}
                    className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors ${mode === "draw" ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                    <Pencil className="size-3" /> Dibujar
                </button>
                <button type="button" onClick={() => setMode("type")}
                    className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors ${mode === "type" ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                    <Font className="size-3" /> Escribir
                </button>
                <div className="flex-1" />
                <button type="button" onClick={clear} disabled={!hasContent}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] disabled:opacity-40 transition-colors">
                    <TrashBin className="size-3" /> Limpiar
                </button>
            </div>

            {/* Pad */}
            <div className="relative rounded-lg overflow-hidden border border-[var(--arbo-border)]" style={{ background: "#ffffff" }}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full block touch-none select-none"
                    style={{ height: H, cursor: mode === "draw" ? "crosshair" : "default" }}
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerLeave={onUp}
                >
                    {mode === "draw"
                        ? strokesRef.current.map((s, i) => (
                            <path key={i} d={strokeToPath(s)} fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        ))
                        : typed.trim() && (
                            <text x="50%" y="62%" textAnchor="middle" fontFamily={SIGN_FONT} fontSize={Math.round(H * 0.45)} fill={INK}>{typed}</text>
                        )}
                    {/* baseline */}
                    <line x1={24} y1={H - 32} x2={W - 24} y2={H - 32} stroke="#D1D5DB" strokeWidth={1} strokeDasharray="6 6" />
                </svg>

                {!hasContent && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-sm text-gray-400">{mode === "draw" ? "Firmá acá ✍️" : "Escribí tu nombre abajo"}</span>
                    </div>
                )}
            </div>

            {mode === "type" && (
                <input
                    type="text"
                    value={typed}
                    onChange={(e) => onTyped(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm outline-none focus:border-[var(--arbo-accent)]"
                />
            )}

            {/* Hidden input carries the value for native form semantics */}
            <input type="hidden" name={name} value={String(state.value || "")} />
            {error && <FieldError>{error}</FieldError>}
        </div>
    );
};
