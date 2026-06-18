import { TextAlignLeft, TextAlignCenter, TextAlignRight, TrashBin, Bold, Italic, Underline } from "@gravity-ui/icons";
import type { PageDecor } from "../../types";
import { DECOR_ICONS } from "../../constants/decor-icons";
import { useEditorContext } from "./EditorContext";
import { normalizePageLayout } from "../../utils/style-helpers";

const ColorRow = ({ label, value, fallback, onChange, onClear }: {
    label: string; value?: string; fallback: string; onChange: (v: string) => void; onClear?: () => void;
}) => (
    <div className="flex items-center justify-between">
        <span className="text-[11px] arbo-text-secondary">{label}</span>
        <div className="flex items-center gap-1.5">
            <input type="color" value={value || fallback} onChange={(e) => onChange(e.target.value)} className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
            {onClear && value && <button onClick={onClear} className="text-[9px] arbo-text-muted hover:text-[var(--arbo-accent)]">×</button>}
        </div>
    </div>
);

const SliderRow = ({ label, value, min, max, step = 1, unit = "", onChange }: {
    label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <span className="text-[11px] arbo-text-secondary">{label}</span>
            <span className="text-[10px] arbo-text-muted font-mono">{value}{unit}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--arbo-accent)]" />
    </div>
);

/** Contextual settings for the decoration selected on the page grid. */
export const PageDecorInspector = ({ decor }: { decor: PageDecor }) => {
    const { styles, updateStyles, setSelectedPageElement } = useEditorContext();

    const patch = (p: Partial<PageDecor>) => {
        const layout = normalizePageLayout(styles.pageLayout);
        updateStyles({
            pageLayout: {
                ...layout,
                decors: (layout.decors || []).map((d) => (d.id === decor.id ? { ...d, ...p } : d)),
            },
        });
    };

    const remove = () => {
        const layout = normalizePageLayout(styles.pageLayout);
        updateStyles({ pageLayout: { ...layout, decors: (layout.decors || []).filter((d) => d.id !== decor.id) } });
        setSelectedPageElement(null);
    };

    const isRect = decor.kind === "rect";
    const isLine = decor.kind === "line";
    const isIcon = decor.kind === "icon";
    const isText = decor.kind === "text";
    const isImage = decor.kind === "image";

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">
                    {isRect ? "Rectángulo" : isLine ? "Línea" : isIcon ? "Icono" : isImage ? "Imagen decorativa" : "Texto"}
                </span>
                <button onClick={remove} title="Eliminar adorno (Supr)"
                    className="p-1 rounded text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] transition-colors cursor-pointer">
                    <TrashBin className="size-3.5" />
                </button>
            </div>

            {/* Layer */}
            <div className="flex flex-col gap-1">
                <span className="text-[11px] arbo-text-secondary">Capa</span>
                <div className="grid grid-cols-2 gap-1">
                    {([{ v: "back", label: "Fondo" }, { v: "front", label: "Frente" }] as const).map(({ v, label }) => (
                        <button key={v} onClick={() => patch({ layer: v })}
                            className={`py-1.5 rounded text-[11px] transition-colors cursor-pointer ${(decor.layer || "back") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Icon picker */}
            {isIcon && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] arbo-text-secondary">Icono</span>
                    <div className="grid grid-cols-4 gap-1.5">
                        {Object.entries(DECOR_ICONS).map(([id, def]) => (
                            <button key={id} onClick={() => patch({ iconId: id })} title={def.label}
                                className={`flex items-center justify-center aspect-square rounded-lg border transition-colors cursor-pointer ${(decor.iconId || "star") === id ? "border-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]" : "border-[var(--arbo-border)] bg-[var(--arbo-surface-2)] hover:border-[var(--arbo-border-light)]"}`}>
                                <svg viewBox="0 0 24 24" className="size-4 arbo-text">
                                    <path d={def.path} fill={def.mode === "fill" ? "currentColor" : "none"} stroke={def.mode === "stroke" ? "currentColor" : "none"} strokeWidth={def.mode === "stroke" ? 2 : 0} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Text content + styles */}
            {isText && (
                <>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] arbo-text-secondary">Texto</span>
                        <textarea value={decor.text || ""} onChange={(e) => patch({ text: e.target.value })} rows={2}
                            className="w-full px-2 py-1.5 rounded bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs resize-none outline-none focus:border-[var(--arbo-accent)]" />
                    </div>
                    <SliderRow label="Tamaño de letra" value={decor.fontSize ?? 16} min={10} max={72} unit="px" onChange={(v) => patch({ fontSize: v })} />
                    <div className="grid grid-cols-3 gap-1">
                        {([
                            { k: "bold" as const, icon: <Bold className="size-3.5" /> },
                            { k: "italic" as const, icon: <Italic className="size-3.5" /> },
                            { k: "underline" as const, icon: <Underline className="size-3.5" /> },
                        ]).map(({ k, icon }) => (
                            <button key={k} onClick={() => patch({ [k]: !decor[k] } as Partial<PageDecor>)}
                                className={`flex items-center justify-center py-1.5 rounded transition-colors cursor-pointer ${decor[k] ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {icon}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {([
                            { v: "left" as const, icon: <TextAlignLeft className="size-3.5" /> },
                            { v: "center" as const, icon: <TextAlignCenter className="size-3.5" /> },
                            { v: "right" as const, icon: <TextAlignRight className="size-3.5" /> },
                        ]).map(({ v, icon }) => (
                            <button key={v} onClick={() => patch({ align: v })}
                                className={`flex items-center justify-center py-1.5 rounded transition-colors cursor-pointer ${(decor.align || "left") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {icon}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Image URL + fit */}
            {isImage && (
                <>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] arbo-text-secondary">URL de la imagen</span>
                        <input type="url" value={decor.imageUrl || ""} onChange={(e) => patch({ imageUrl: e.target.value })}
                            placeholder="https://…/imagen.png"
                            className="w-full px-2 py-1.5 rounded bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs outline-none focus:border-[var(--arbo-accent)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                        {([{ v: "cover", label: "Cubrir" }, { v: "contain", label: "Contener" }] as const).map(({ v, label }) => (
                            <button key={v} onClick={() => patch({ imageFit: v })}
                                className={`py-1.5 rounded text-[11px] transition-colors cursor-pointer ${(decor.imageFit || "cover") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Colors */}
            <div className="flex flex-col gap-2 pt-1 border-t border-[var(--arbo-border)]">
                {(isRect || isLine) && (
                    <ColorRow label={isLine ? "Color" : "Relleno"} value={decor.bgColor} fallback="#FFFFFF" onChange={(v) => patch({ bgColor: v })} onClear={() => patch({ bgColor: undefined })} />
                )}
                {isRect && (
                    <ColorRow label="Borde" value={decor.borderColor} fallback="#FFFFFF" onChange={(v) => patch({ borderColor: v })} onClear={() => patch({ borderColor: undefined })} />
                )}
                {(isIcon || isText) && (
                    <ColorRow label="Color" value={decor.textColor} fallback={isIcon ? "#4ADE80" : "#FFFFFF"} onChange={(v) => patch({ textColor: v })} />
                )}
            </div>

            {(isRect || isLine) && (
                <SliderRow label={isLine ? "Grosor" : "Grosor de borde"} value={decor.borderWidth ?? (isLine ? 2 : 1)} min={1} max={12} unit="px" onChange={(v) => patch({ borderWidth: v })} />
            )}
            {(isRect || isImage) && (
                <SliderRow label="Redondez" value={decor.radius ?? (isImage ? 12 : 14)} min={0} max={60} unit="px" onChange={(v) => patch({ radius: v })} />
            )}
            <SliderRow label="Opacidad" value={decor.opacity ?? 100} min={5} max={100} step={5} unit="%" onChange={(v) => patch({ opacity: v })} />
        </div>
    );
};
