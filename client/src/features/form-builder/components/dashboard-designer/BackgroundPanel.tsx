// ─── Background editor for the dashboard: glow orbs, gradient, image ───
// Same capabilities as the form page background, scoped to the dashboard design.

import { useRef, useState } from "react";
import { TrashBin, ChevronDown } from "@gravity-ui/icons";
import {
    type DashboardDesign, type GlowOrb, PALETTE, GRADIENT_PRESETS, getDashboardBgCss,
} from "./types";

interface Props {
    design: DashboardDesign;
    onChange: (patch: Partial<DashboardDesign>) => void;
}

const Section = ({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
    const [open, setOpen] = useState(!!defaultOpen);
    return (
        <div className="border border-[var(--arbo-border)] rounded-lg overflow-hidden">
            <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[var(--arbo-surface-2)] text-[11px] font-semibold arbo-text">
                {title}
                <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && <div className="p-2.5 flex flex-col gap-2.5">{children}</div>}
        </div>
    );
};

const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center justify-between text-[11px] arbo-text-secondary cursor-pointer">
        {label}
        <button
            onClick={() => onChange(!value)}
            className={`relative w-8 h-4 rounded-full transition-colors ${value ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-surface-3)]"}`}
        >
            <span className={`absolute top-0.5 size-3 rounded-full bg-white transition-all ${value ? "left-4" : "left-0.5"}`} />
        </button>
    </label>
);

export const BackgroundPanel = ({ design, onChange }: Props) => {
    const previewRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const dragMovedRef = useRef(false);

    const orbs: GlowOrb[] = design.glowOrbs || [];
    const glowOn = design.glowEnabled ?? false;

    const updateOrb = (id: string, patch: Partial<GlowOrb>) =>
        onChange({ glowOrbs: orbs.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
    const removeOrb = (id: string) => onChange({ glowOrbs: orbs.filter((o) => o.id !== id) });
    const addOrb = (x: number, y: number) => {
        const color = PALETTE[orbs.length % PALETTE.length];
        onChange({ glowEnabled: true, glowOrbs: [...orbs, { id: crypto.randomUUID(), x, y, size: 60, opacity: 50, color }] });
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

    // Click anywhere on the preview to drop a new light at that spot (like the form editor).
    const handlePreviewClick = (e: React.MouseEvent) => {
        if (dragMovedRef.current) { dragMovedRef.current = false; return; }
        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        addOrb(
            Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))),
            Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))),
        );
    };

    const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onChange({ bgImage: String(reader.result) });
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col gap-2.5">
            {/* Base color */}
            <Section title="Color base" defaultOpen>
                <label className="flex items-center justify-between text-[11px] arbo-text-secondary cursor-pointer">
                    Fondo
                    <input type="color" value={design.bg || "#0c0c18"} onChange={(e) => onChange({ bg: e.target.value })} className="size-7 rounded cursor-pointer border border-[var(--arbo-border)]" />
                </label>
            </Section>

            {/* Gradient */}
            <Section title="Gradiente">
                <div className="grid grid-cols-2 gap-1.5">
                    {GRADIENT_PRESETS.map((g) => (
                        <button
                            key={g.name}
                            onClick={() => onChange({ gradient: design.gradient === g.css ? undefined : g.css })}
                            title={g.name}
                            className={`h-9 rounded-md border text-[9px] font-medium text-white/90 ${design.gradient === g.css ? "border-[var(--arbo-accent)] ring-1 ring-[var(--arbo-accent)]" : "border-[var(--arbo-border)]"}`}
                            style={{ background: g.css }}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>
                {design.gradient && (
                    <button onClick={() => onChange({ gradient: undefined })} className="text-[10px] arbo-text-muted hover:text-[var(--arbo-danger)] self-start">Quitar gradiente</button>
                )}
            </Section>

            {/* Glow orbs */}
            <Section title="Luces (glow)">
                <div className="flex items-center justify-between">
                    <p className="text-[9px] arbo-text-muted">Cliqueá en la miniatura para agregar una luz</p>
                    <Toggle value={glowOn} onChange={(v) => onChange({ glowEnabled: v })} label="" />
                </div>
                {/* Mini preview: click to add, drag dots to move */}
                <div
                    ref={previewRef}
                    onClick={handlePreviewClick}
                    className="relative w-full h-24 rounded-lg overflow-hidden border border-[var(--arbo-border)] select-none"
                    style={{ background: getDashboardBgCss(design), cursor: "crosshair" }}
                >
                    {glowOn && orbs.map((o) => (
                        <div
                            key={o.id}
                            onMouseDown={(e) => startDrag(e, o.id)}
                            className="absolute flex items-center justify-center"
                            style={{ left: `${o.x}%`, top: `${o.y}%`, transform: "translate(-50%, -50%)", width: 18, height: 18, cursor: "grab", zIndex: 10 }}
                            title="Arrastrar"
                        >
                            <div className="rounded-full border-2 border-white shadow-lg" style={{ width: 12, height: 12, background: o.color, boxShadow: `0 0 8px ${o.color}` }} />
                        </div>
                    ))}
                    {(!glowOn || orbs.length === 0) && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-white/30">Cliqueá para agregar una luz</span>
                        </div>
                    )}
                </div>
                {glowOn && orbs.map((o, i) => (
                    <div key={o.id} className="flex flex-col gap-1 p-2 rounded-md bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] arbo-text-muted">Luz {i + 1}</span>
                            <div className="flex items-center gap-1.5">
                                <input type="color" value={o.color} onChange={(e) => updateOrb(o.id, { color: e.target.value })} className="size-5 rounded cursor-pointer border border-[var(--arbo-border)]" />
                                <button onClick={() => removeOrb(o.id)} className="arbo-text-muted hover:text-[var(--arbo-danger)]"><TrashBin className="size-3.5" /></button>
                            </div>
                        </div>
                        <label className="flex items-center gap-1.5 text-[9px] arbo-text-muted">Tamaño
                            <input type="range" min={20} max={150} value={o.size} onChange={(e) => updateOrb(o.id, { size: Number(e.target.value) })} className="flex-1 accent-[var(--arbo-accent)]" />
                        </label>
                        <label className="flex items-center gap-1.5 text-[9px] arbo-text-muted">Opacidad
                            <input type="range" min={0} max={100} value={o.opacity} onChange={(e) => updateOrb(o.id, { opacity: Number(e.target.value) })} className="flex-1 accent-[var(--arbo-accent)]" />
                        </label>
                    </div>
                ))}
            </Section>

            {/* Image */}
            <Section title="Imagen de fondo">
                <div className="flex items-center gap-1.5">
                    <input
                        type="url"
                        value={design.bgImage?.startsWith("data:") ? "" : (design.bgImage || "")}
                        onChange={(e) => onChange({ bgImage: e.target.value || undefined })}
                        placeholder={design.bgImage?.startsWith("data:") ? "(imagen subida)" : "https://…/imagen.jpg"}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-[11px] outline-none focus:border-[var(--arbo-accent)]"
                    />
                    {design.bgImage && (
                        <button onClick={() => onChange({ bgImage: undefined })} className="text-[10px] arbo-text-muted hover:text-[var(--arbo-danger)] px-1">×</button>
                    )}
                </div>
                <button onClick={() => fileRef.current?.click()} className="text-[10px] arbo-btn arbo-btn-secondary py-1">Subir imagen…</button>
                <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />

                {design.bgImage && (
                    <>
                        <div className="grid grid-cols-2 gap-1">
                            {(["cover", "contain"] as const).map((v) => (
                                <button key={v} onClick={() => onChange({ bgImageFit: v })}
                                    className={`px-1 py-1 rounded-md text-[9px] font-medium ${(design.bgImageFit || "cover") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                    {v === "cover" ? "Cubrir" : "Contener"}
                                </button>
                            ))}
                        </div>
                        <label className="flex items-center gap-1.5 text-[9px] arbo-text-muted">Opacidad
                            <input type="range" min={10} max={100} value={design.bgImageOpacity ?? 100} onChange={(e) => onChange({ bgImageOpacity: Number(e.target.value) })} className="flex-1 accent-[var(--arbo-accent)]" />
                        </label>
                        <label className="flex items-center gap-1.5 text-[9px] arbo-text-muted">Pos. X
                            <input type="range" min={0} max={100} value={design.bgImagePosX ?? 50} onChange={(e) => onChange({ bgImagePosX: Number(e.target.value) })} className="flex-1 accent-[var(--arbo-accent)]" />
                        </label>
                        <label className="flex items-center gap-1.5 text-[9px] arbo-text-muted">Pos. Y
                            <input type="range" min={0} max={100} value={design.bgImagePosY ?? 50} onChange={(e) => onChange({ bgImagePosY: Number(e.target.value) })} className="flex-1 accent-[var(--arbo-accent)]" />
                        </label>
                    </>
                )}
            </Section>
        </div>
    );
};
