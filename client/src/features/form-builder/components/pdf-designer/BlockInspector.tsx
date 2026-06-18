import { TextAlignLeft, TextAlignCenter, TextAlignRight, TrashBin, Bold, Italic, Underline, ChevronUp, ChevronDown, Copy, CopyCheck } from "@gravity-ui/icons";
import type { PdfBlock } from "./types";
import { PDF_ICONS } from "./icons";

interface BlockInspectorProps {
    block: PdfBlock | null;
    multiCount: number;
    onChange: (patch: Partial<PdfBlock>) => void;
    onDelete: () => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
    onCopyStyle: () => void;
    onPasteStyle: () => void;
    canPaste: boolean;
}

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

export const BlockInspector = ({ block, multiCount, onChange, onDelete, onBringToFront, onSendToBack, onCopyStyle, onPasteStyle, canPaste }: BlockInspectorProps) => {
    if (!block) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <p className="text-[11px] arbo-text-muted text-center">Seleccioná un bloque del lienzo para editar.<br /><span className="opacity-70">Shift+clic para seleccionar varios.</span></p>
            </div>
        );
    }
    const multi = multiCount > 1;

    const isText = block.kind === "text";
    const isField = block.kind === "field";
    const isShape = block.kind === "shape";
    const isIcon = block.kind === "icon";
    const isMetaField = block.kind === "meta" && !!block.metaField;
    const labeled = isField || isMetaField;
    const hasText = block.kind === "title" || isText || isField || isMetaField;
    const kindLabel = isField ? "Campo"
        : block.kind === "title" ? "Título"
        : block.kind === "meta" ? (isMetaField ? "Contacto" : "Datos")
        : isShape ? (block.shape === "line" ? "Línea" : "Rectángulo")
        : isIcon ? "Icono"
        : "Texto";

    return (
        <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">
                    {multi ? `${multiCount} seleccionados` : kindLabel}
                </span>
                <div className="flex items-center gap-1">
                    <button onClick={onBringToFront} title="Traer al frente" className="p-1 rounded arbo-text-muted hover:arbo-text hover:bg-[var(--arbo-surface-2)] transition-colors"><ChevronUp className="size-3.5" /></button>
                    <button onClick={onSendToBack} title="Enviar al fondo" className="p-1 rounded arbo-text-muted hover:arbo-text hover:bg-[var(--arbo-surface-2)] transition-colors"><ChevronDown className="size-3.5" /></button>
                    <button onClick={onDelete} title={multi ? "Eliminar seleccionados" : "Eliminar bloque"} className="p-1 rounded text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] transition-colors"><TrashBin className="size-3.5" /></button>
                </div>
            </div>

            {/* Copy / paste style */}
            <div className="grid grid-cols-2 gap-1.5">
                <button onClick={onCopyStyle} title="Copiar estilo (Ctrl+C)"
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-secondary hover:arbo-text text-[11px] transition-colors cursor-pointer active:scale-95">
                    <Copy className="size-3.5" /> Copiar
                </button>
                <button onClick={onPasteStyle} disabled={!canPaste} title="Pegar estilo (Ctrl+V)"
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-secondary hover:arbo-text text-[11px] transition-colors cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                    <CopyCheck className="size-3.5" /> Pegar
                </button>
            </div>

            {/* Icon picker */}
            {isIcon && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] arbo-text-secondary">Icono</span>
                    <div className="grid grid-cols-4 gap-1.5">
                        {Object.entries(PDF_ICONS).map(([id, def]) => (
                            <button
                                key={id}
                                onClick={() => onChange({ iconId: id })}
                                title={def.label}
                                className={`flex items-center justify-center aspect-square rounded-lg border transition-colors ${
                                    (block.iconId || "star") === id
                                        ? "border-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]"
                                        : "border-[var(--arbo-border)] bg-[var(--arbo-surface-2)] hover:border-[var(--arbo-border-light)]"
                                }`}
                            >
                                <svg viewBox="0 0 24 24" className="size-4 arbo-text">
                                    <path d={def.path} fill={def.mode === "fill" ? "currentColor" : "none"} stroke={def.mode === "stroke" ? "currentColor" : "none"} strokeWidth={def.mode === "stroke" ? 2 : 0} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Shape type */}
            {isShape && (
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] arbo-text-secondary">Figura</span>
                    <div className="grid grid-cols-2 gap-1">
                        {([{ v: "rect", label: "Rectángulo" }, { v: "line", label: "Línea" }] as const).map(({ v, label }) => (
                            <button key={v} onClick={() => onChange({ shape: v })}
                                className={`py-1.5 rounded text-[11px] transition-colors ${(block.shape || "rect") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Custom text */}
            {isText && (
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] arbo-text-secondary">Texto</span>
                    <textarea value={block.text || ""} onChange={(e) => onChange({ text: e.target.value })} rows={2}
                        className="w-full px-2 py-1.5 rounded bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs resize-none" />
                </div>
            )}

            {/* Show label */}
            {labeled && (
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[11px] arbo-text-secondary">Mostrar etiqueta</span>
                    <input type="checkbox" checked={block.showLabel !== false} onChange={(e) => onChange({ showLabel: e.target.checked })} />
                </label>
            )}

            {/* Label position */}
            {labeled && block.showLabel !== false && (
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] arbo-text-secondary">Etiqueta y respuesta</span>
                    <div className="grid grid-cols-2 gap-1">
                        {([{ v: "top", label: "Apilada" }, { v: "left", label: "Al lado" }] as const).map(({ v, label }) => (
                            <button key={v} onClick={() => onChange({ labelPos: v })}
                                className={`py-1.5 rounded text-[11px] transition-colors ${(block.labelPos || "top") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Text styles B / I / U */}
            {hasText && (
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] arbo-text-secondary">Estilo de texto</span>
                    <div className="grid grid-cols-3 gap-1">
                        {([
                            { k: "bold", icon: <Bold className="size-3.5" /> },
                            { k: "italic", icon: <Italic className="size-3.5" /> },
                            { k: "underline", icon: <Underline className="size-3.5" /> },
                        ] as const).map(({ k, icon }) => (
                            <button key={k} onClick={() => onChange({ [k]: !block[k] } as Partial<PdfBlock>)}
                                className={`flex items-center justify-center py-1.5 rounded transition-colors ${block[k] ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Colors */}
            <div className="flex flex-col gap-2 pt-1 border-t border-[var(--arbo-border)]">
                {!isIcon && <ColorRow label={isShape && block.shape === "line" ? "Color" : "Fondo"} value={block.bgColor} fallback="#FFFFFF" onChange={(v) => onChange({ bgColor: v })} onClear={() => onChange({ bgColor: undefined })} />}
                {!isShape && <ColorRow label="Borde" value={block.borderColor} fallback="#D1D5DB" onChange={(v) => onChange({ borderColor: v })} onClear={() => onChange({ borderColor: undefined })} />}
                {isShape && block.shape === "rect" && <ColorRow label="Borde" value={block.borderColor} fallback="#D1D5DB" onChange={(v) => onChange({ borderColor: v })} onClear={() => onChange({ borderColor: undefined })} />}
                {hasText && <ColorRow label="Texto" value={block.textColor} fallback="#111827" onChange={(v) => onChange({ textColor: v })} />}
                {isIcon && <ColorRow label="Color" value={block.textColor} fallback="#4ADE80" onChange={(v) => onChange({ textColor: v })} />}
                {labeled && block.showLabel !== false && <ColorRow label="Etiqueta" value={block.labelColor} fallback="#6B7280" onChange={(v) => onChange({ labelColor: v })} />}
            </div>

            {/* Border / line width */}
            {(isShape || block.borderColor) && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] arbo-text-secondary">{isShape && block.shape === "line" ? "Grosor de línea" : "Grosor de borde"}</span>
                        <span className="text-[10px] arbo-text-muted font-mono">{block.borderWidth || (isShape && block.shape === "line" ? 2 : 1)}pt</span>
                    </div>
                    <input type="range" min={1} max={10} step={1} value={block.borderWidth || (isShape && block.shape === "line" ? 2 : 1)}
                        onChange={(e) => onChange({ borderWidth: Number(e.target.value) })} className="w-full accent-[var(--arbo-accent)]" />
                </div>
            )}

            {/* Font size */}
            {hasText && (
                <div className="flex flex-col gap-1 pt-1 border-t border-[var(--arbo-border)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] arbo-text-secondary">Tamaño de letra</span>
                        <span className="text-[10px] arbo-text-muted font-mono">{block.fontSize || 10}pt</span>
                    </div>
                    <input type="range" min={7} max={28} step={1} value={block.fontSize || 10}
                        onChange={(e) => onChange({ fontSize: Number(e.target.value) })} className="w-full accent-[var(--arbo-accent)]" />
                </div>
            )}

            {/* Alignment */}
            {hasText && (
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] arbo-text-secondary">Alineación</span>
                    <div className="grid grid-cols-3 gap-1">
                        {([
                            { v: "left", icon: <TextAlignLeft className="size-3.5" /> },
                            { v: "center", icon: <TextAlignCenter className="size-3.5" /> },
                            { v: "right", icon: <TextAlignRight className="size-3.5" /> },
                        ] as const).map(({ v, icon }) => (
                            <button key={v} onClick={() => onChange({ align: v })}
                                className={`flex items-center justify-center py-1.5 rounded transition-colors ${(block.align || "left") === v ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-[var(--arbo-border)] text-[10px] arbo-text-muted font-mono">
                <span>pos {block.x},{block.y}</span>
                <span>{block.w}×{block.h}</span>
            </div>
        </div>
    );
};
