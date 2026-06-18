import { useCallback, useEffect, useMemo, useState } from "react";
import { Xmark, Plus, ArrowsRotateLeft, FloppyDisk, FileText, Heading, Person, Square, Minus, Star } from "@gravity-ui/icons";
import { formApi } from "@/services/api";
import { DesignerCanvas } from "./DesignerCanvas";
import { BlockInspector } from "./BlockInspector";
import {
    type PdfDesign, type PdfBlock, type DesignerField, type MetaField,
    buildDefaultDesign, normalizeDesign, clamp, META_LABELS,
} from "./types";
import { DEFAULT_ICON } from "./icons";

// Style props copied/pasted between blocks
const STYLE_KEYS: (keyof PdfBlock)[] = [
    "bgColor", "textColor", "labelColor", "borderColor", "borderWidth",
    "fontSize", "align", "bold", "italic", "underline", "labelPos", "showLabel",
];

// Palette button with hover + click feedback
const PaletteBtn = ({ icon, label, onClick, active = false, title }: {
    icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; title?: string;
}) => (
    <button
        onClick={onClick}
        title={title}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs text-left transition-all cursor-pointer active:scale-95 ${
            active
                ? "bg-[var(--arbo-accent-muted)] border-[var(--arbo-accent)]/30 arbo-text"
                : "bg-[var(--arbo-surface-2)] border-[var(--arbo-border)] arbo-text-secondary hover:arbo-text hover:border-[var(--arbo-accent)]/40"
        }`}
    >
        {icon}<span className="truncate">{label}</span>
    </button>
);

interface PdfDesignerModalProps {
    formId: number;
    formTitle: string;
    fields: DesignerField[];
    initial?: any;
    defaultAccent?: string;
    onClose: () => void;
    onSaved: (design: PdfDesign) => void;
    onPreview?: (design: PdfDesign) => void;   // preview current (unsaved) design
}

export const PdfDesignerModal = ({
    formId, formTitle, fields, initial, defaultAccent = "#4ADE80",
    onClose, onSaved, onPreview,
}: PdfDesignerModalProps) => {
    const [design, setDesign] = useState<PdfDesign>(() => normalizeDesign(fields, initial, defaultAccent));
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [copiedStyle, setCopiedStyle] = useState<Partial<PdfBlock> | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const primaryId = selectedIds.length ? selectedIds[selectedIds.length - 1] : null;
    const selectedBlock = design.blocks.find((b) => b.id === primaryId) || null;
    const placed = useMemo(() => new Set(design.blocks.filter((b) => b.kind === "field").map((b) => b.fieldName)), [design.blocks]);

    // Selection — shift adds/removes, plain click replaces, null clears
    const handleSelect = useCallback((id: string | null, additive: boolean) => {
        if (id === null) { setSelectedIds([]); return; }
        setSelectedIds((prev) => additive
            ? (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
            : [id]);
    }, []);

    const updateBlock = useCallback((id: string, patch: Partial<PdfBlock>) => {
        setDesign((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
    }, []);

    // Apply a patch to every selected block (used by the inspector)
    const updateSelected = useCallback((patch: Partial<PdfBlock>) => {
        setDesign((d) => ({ ...d, blocks: d.blocks.map((b) => (selectedIds.includes(b.id) ? { ...b, ...patch } : b)) }));
    }, [selectedIds]);

    const updatePositions = useCallback((updates: { id: string; x: number; y: number }[]) => {
        const m = new Map(updates.map((u) => [u.id, u]));
        setDesign((d) => ({ ...d, blocks: d.blocks.map((b) => (m.has(b.id) ? { ...b, x: m.get(b.id)!.x, y: m.get(b.id)!.y } : b)) }));
    }, []);

    const deleteSelected = useCallback(() => {
        setDesign((d) => ({ ...d, blocks: d.blocks.filter((b) => !selectedIds.includes(b.id)) }));
        setSelectedIds([]);
    }, [selectedIds]);

    // Copy / paste style
    const copyStyle = useCallback(() => {
        if (!selectedBlock) return;
        const s: Partial<PdfBlock> = {};
        STYLE_KEYS.forEach((k) => {
            const v = (selectedBlock as any)[k];
            if (v !== undefined) (s as any)[k] = v;
        });
        setCopiedStyle(s);
    }, [selectedBlock]);

    const pasteStyle = useCallback(() => {
        if (copiedStyle) updateSelected(copiedStyle);
    }, [copiedStyle, updateSelected]);

    const bottomY = useCallback((d: PdfDesign) => d.blocks.reduce((m, b) => Math.max(m, b.y + b.h), 0), []);

    // Add a block at the bottom of the current content and select it (canvas auto-scrolls to it).
    const addBlock = (make: (d: PdfDesign, y: number, id: string) => PdfBlock, toBack = false) => {
        const id = crypto.randomUUID();
        setDesign((d) => {
            const y = clamp(bottomY(d), 0, d.rows - 1);
            const block = make(d, y, id);
            return { ...d, blocks: toBack ? [block, ...d.blocks] : [...d.blocks, block] };
        });
        setSelectedIds([id]);
        setError(null);
    };

    const addFieldBlock = (field: DesignerField) => addBlock((d, y, id) => ({
        id, kind: "field", fieldName: field.name,
        x: 0, y, w: d.cols, h: 1, showLabel: true, labelColor: "#6B7280", textColor: "#111827", fontSize: 10, align: "left",
    }));

    const addSpecial = (kind: "title" | "text") => addBlock((d, y, id) => kind === "title"
        ? { id, kind: "title", x: 0, y, w: d.cols, h: 1, showLabel: false, align: "center", textColor: "#111827", fontSize: 18 }
        : { id, kind: "text", x: 0, y, w: d.cols, h: 1, text: "Texto personalizado", textColor: "#111827", fontSize: 11, align: "left" });

    const addMeta = (metaField: MetaField) => addBlock((d, y, id) => ({
        id, kind: "meta", metaField,
        x: 0, y, w: Math.min(d.cols, Math.round(d.cols / 2)), h: 1,
        showLabel: true, labelPos: "left", labelColor: "#6B7280", textColor: "#111827", fontSize: 10, align: "left",
    }));

    const addShape = (shape: "rect" | "line") => addBlock((d, y, id) => shape === "line"
        ? { id, kind: "shape", shape, x: 0, y, w: d.cols, h: 1, bgColor: "#111827", borderWidth: 2 }
        : { id, kind: "shape", shape, x: 0, y, w: Math.min(d.cols, 4), h: 1, bgColor: "#E5E7EB", borderWidth: 1 },
        true); // shapes go to the back so they sit behind text

    const addIcon = () => addBlock((d, y, id) => ({
        id, kind: "icon", iconId: DEFAULT_ICON,
        x: 0, y, w: 2, h: 2, textColor: d.accentColor || "#4ADE80",
    }));

    const bringToFront = () => setDesign((d) => {
        const sel = d.blocks.filter((b) => selectedIds.includes(b.id));
        const rest = d.blocks.filter((b) => !selectedIds.includes(b.id));
        return { ...d, blocks: [...rest, ...sel] };
    });
    const sendToBack = () => setDesign((d) => {
        const sel = d.blocks.filter((b) => selectedIds.includes(b.id));
        const rest = d.blocks.filter((b) => !selectedIds.includes(b.id));
        return { ...d, blocks: [...sel, ...rest] };
    });

    const setCols = (cols: number) => setDesign((d) => ({
        ...d, cols,
        blocks: d.blocks.map((b) => ({ ...b, x: clamp(b.x, 0, cols - 1), w: clamp(b.w, 1, cols - clamp(b.x, 0, cols - 1)) })),
    }));
    const setRows = (rows: number) => setDesign((d) => ({
        ...d, rows: clamp(rows, 4, 40),
        blocks: d.blocks.map((b) => ({ ...b, y: clamp(b.y, 0, rows - 1), h: clamp(b.h, 1, rows - clamp(b.y, 0, rows - 1)) })),
    }));

    const handleReset = () => { setDesign(buildDefaultDesign(fields, defaultAccent)); setSelectedIds([]); };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await formApi.savePdfLayout(formId, design);
            onSaved(design);
            onClose();
        } catch (e: any) {
            setError(e.message || "Error al guardar el diseño");
        } finally {
            setSaving(false);
        }
    };

    // Keyboard: Delete removes selection, Ctrl/Cmd+C copies style, Ctrl/Cmd+V pastes style
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
            if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
                e.preventDefault();
                deleteSelected();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && selectedBlock) {
                e.preventDefault();
                copyStyle();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v" && copiedStyle && selectedIds.length) {
                e.preventDefault();
                pasteStyle();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selectedIds, deleteSelected, selectedBlock, copyStyle, copiedStyle, pasteStyle]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="arbo-panel w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="arbo-panel-header flex items-center justify-between shrink-0">
                    <span>Diseñador de PDF — arrastrá y posicioná los bloques</span>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[var(--arbo-surface-2)] arbo-text-muted transition-colors">
                        <Xmark className="size-4" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--arbo-border)] shrink-0 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="arbo-text-secondary">Columnas</span>
                        {[8, 12, 16].map((c) => (
                            <button key={c} onClick={() => setCols(c)}
                                className={`size-6 rounded text-[11px] font-semibold transition-colors ${design.cols === c ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {c}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="arbo-text-secondary">Filas</span>
                        <button onClick={() => setRows(design.rows - 1)} className="size-6 rounded bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]">−</button>
                        <span className="font-mono arbo-text w-5 text-center">{design.rows}</span>
                        <button onClick={() => setRows(design.rows + 1)} className="size-6 rounded bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]">+</button>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer arbo-text-secondary">
                        Fondo de página
                        <input type="color" value={design.pageBg || "#FFFFFF"} onChange={(e) => setDesign((d) => ({ ...d, pageBg: e.target.value }))} className="size-6 rounded cursor-pointer border border-[var(--arbo-border)]" />
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer arbo-text-secondary">
                        <input type="checkbox" checked={!!design.numberQuestions} onChange={(e) => setDesign((d) => ({ ...d, numberQuestions: e.target.checked }))} />
                        Numerar secciones
                    </label>
                </div>

                {/* Body: palette | canvas | inspector */}
                <div className="flex-1 flex min-h-0">
                    {/* Palette */}
                    <div className="w-48 shrink-0 border-r border-[var(--arbo-border)] flex flex-col overflow-y-auto p-3 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Bloques</span>
                            <PaletteBtn icon={<Heading className="size-3.5" />} label="Título" onClick={() => addSpecial("title")} />
                            <PaletteBtn icon={<FileText className="size-3.5" />} label="Texto libre" onClick={() => addSpecial("text")} />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Contacto</span>
                            {(["name", "email", "date"] as MetaField[]).map((mf) => (
                                <PaletteBtn key={mf} icon={<Person className="size-3.5 opacity-60" />} label={META_LABELS[mf]} onClick={() => addMeta(mf)} />
                            ))}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Decoración</span>
                            <PaletteBtn icon={<Square className="size-3.5" />} label="Rectángulo" onClick={() => addShape("rect")} />
                            <PaletteBtn icon={<Minus className="size-3.5" />} label="Línea" onClick={() => addShape("line")} />
                            <PaletteBtn icon={<Star className="size-3.5" />} label="Icono" onClick={addIcon} />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Campos</span>
                            {fields.length === 0 && <p className="text-[10px] arbo-text-muted">Sin campos</p>}
                            {fields.map((f) => (
                                <PaletteBtn
                                    key={f.name}
                                    icon={<Plus className="size-3 shrink-0 opacity-60" />}
                                    label={f.label || f.name}
                                    active={placed.has(f.name)}
                                    onClick={() => addFieldBlock(f)}
                                    title={placed.has(f.name) ? "Ya está en el lienzo — clic para agregar otro" : "Agregar al lienzo"}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 min-w-0 overflow-auto p-6 flex justify-center items-start" style={{ background: "var(--arbo-surface)" }}>
                        <div className="w-full" style={{ maxWidth: 560 }}>
                            <DesignerCanvas
                                design={design}
                                fields={fields}
                                formTitle={formTitle}
                                selectedIds={selectedIds}
                                primaryId={primaryId}
                                onSelect={handleSelect}
                                onChange={updateBlock}
                                onUpdatePositions={updatePositions}
                            />
                            <p className="text-[10px] arbo-text-muted text-center mt-2">Arrastrá para mover · Shift+clic para seleccionar varios · tirá de los puntos para redimensionar · Supr para borrar</p>
                        </div>
                    </div>

                    {/* Inspector */}
                    <div className="w-56 shrink-0 border-l border-[var(--arbo-border)] flex flex-col min-h-0">
                        <BlockInspector
                            block={selectedBlock}
                            multiCount={selectedIds.length}
                            onChange={updateSelected}
                            onDelete={deleteSelected}
                            onBringToFront={bringToFront}
                            onSendToBack={sendToBack}
                            onCopyStyle={copyStyle}
                            onPasteStyle={pasteStyle}
                            canPaste={!!copiedStyle}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--arbo-border)] shrink-0">
                    <button onClick={handleReset} className="arbo-btn arbo-btn-ghost text-xs">
                        <ArrowsRotateLeft className="size-3.5" /> Restablecer
                    </button>
                    {error && <span className="text-xs text-[var(--arbo-danger)]">{error}</span>}
                    <div className="flex-1" />
                    {onPreview && (
                        <button onClick={() => onPreview(design)} className="arbo-btn arbo-btn-secondary text-xs" title="Ver el PDF con el diseño actual (sin guardar)">
                            <FileText className="size-3.5" /> Previsualizar
                        </button>
                    )}
                    <button onClick={onClose} className="arbo-btn arbo-btn-secondary text-xs">Cancelar</button>
                    <button onClick={handleSave} disabled={saving} className="arbo-btn arbo-btn-primary text-xs disabled:opacity-50">
                        <FloppyDisk className="size-3.5" /> {saving ? "Guardando..." : "Guardar diseño"}
                    </button>
                </div>
            </div>
        </div>
    );
};
