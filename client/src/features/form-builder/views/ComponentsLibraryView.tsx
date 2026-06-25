import { useCallback, useEffect, useState } from "react";
import { Plus, TrashBin, Globe, Lock, Xmark, Sparkles, Magnifier } from "@gravity-ui/icons";
import { blockApi, formApi, type FieldBlockDto } from "@/services/api";
import type { ComponentType, FormField } from "@/core/form-engine/types";
import { getInputPalette } from "@/core/form-engine/constants/editor-constants";
import { mapAIFields } from "@/core/form-engine/utils/ai-field-mapper";
import { LogicFlowEditor } from "@/core/form-engine/components/editor/LogicFlowEditor";
import { BlockPreview } from "@/core/form-engine/components/ui/BlockPreview";
import { SortableField } from "@/core/form-engine/components/ui/sortable/SortableField";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useTranslation } from "react-i18next";

/** Options editor that parses on blur/Enter so typing commas works normally. */
const OptionsInput = ({ value, onCommit }: { value: string[]; onCommit: (opts: string[]) => void }) => {
    const [text, setText] = useState(value.join(", "));
    useEffect(() => { setText(value.join(", ")); }, [value]);
    const commit = () => onCommit(text.split(",").map((s) => s.trim()).filter(Boolean));
    return (
        <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
            placeholder="opciones separadas por coma (Enter para aplicar)"
            className="flex-1 min-w-32 px-2 py-1 rounded bg-[var(--arbo-surface-3)] border border-transparent focus:border-[var(--arbo-accent)] arbo-text text-[11px] focus:outline-none"
        />
    );
};

const SPAN_OPTIONS = [
    { label: "100%", value: 12 },
    { label: "75%", value: 9 },
    { label: "66%", value: 8 },
    { label: "50%", value: 6 },
    { label: "33%", value: 4 },
    { label: "25%", value: 3 },
];

interface Draft {
    id?: number;
    name: string;
    isPublic: boolean;
    fields: FormField[];
}

const emptyDraft = (): Draft => ({ name: "", isPublic: false, fields: [] });

const OPTION_COMPONENTS = ["DynamicSelect", "DynamicMultiSelect", "DynamicCheckbox", "DynamicRadioGroup"];

/**
 * Standalone composite-component builder: create field blocks with conditional
 * logic ahead of time, save them to your library, share them, and add public
 * blocks from other users. Blocks are inserted later from the form editor (+ panel).
 */
export const ComponentsLibraryView = () => {
    const { t } = useTranslation();
    const [blocks, setBlocks] = useState<FieldBlockDto[]>([]);
    const [publicBlocks, setPublicBlocks] = useState<FieldBlockDto[] | null>(null);
    const [draft, setDraft] = useState<Draft>(emptyDraft());
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<"nodes" | "preview">("nodes");

    // AI creation
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);

    const palette = getInputPalette(t);

    const load = useCallback(async () => {
        try {
            const res = await blockApi.getMine();
            setBlocks(res.data);
        } catch (e: any) { setError(e.message); }
    }, []);
    useEffect(() => { load(); }, [load]);

    const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3500); };

    // --- Draft field operations ---
    const addField = (item: { componentType: ComponentType; type: string; label: string }) => {
        const name = `${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now() % 100000}`;
        const field: FormField = {
            id: crypto.randomUUID(),
            name,
            label: item.label,
            placeholder: "",
            type: item.type,
            componentType: item.componentType,
            value: "",
            required: false,
            validate: [],
            sortOrder: draft.fields.length,
            page: 0,
            ...(OPTION_COMPONENTS.includes(item.componentType) ? { options: ["Sí", "No"] } : {}),
        };
        setDraft((d) => ({ ...d, fields: [...d.fields, field] }));
    };

    const updateField = (name: string, patch: Partial<FormField>) =>
        setDraft((d) => ({ ...d, fields: d.fields.map((f) => (f.name === name ? { ...f, ...patch } : f)) }));

    const removeField = (name: string) =>
        setDraft((d) => ({
            ...d,
            fields: d.fields
                .filter((f) => f.name !== name)
                .map((f) => ({
                    ...f,
                    visibleWhen: f.visibleWhen?.filter((c) => c.field !== name),
                    hiddenWhen: f.hiddenWhen?.filter((c) => c.field !== name),
                })),
        }));

    const reorderField = (oldIndex: number, newIndex: number) =>
        setDraft((d) => ({ ...d, fields: arrayMove(d.fields, oldIndex, newIndex) }));

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = draft.fields.findIndex((f) => f.name === active.id);
        const newIndex = draft.fields.findIndex((f) => f.name === over.id);
        if (oldIndex !== -1 && newIndex !== -1) reorderField(oldIndex, newIndex);
    };

    const onFieldsChange = useCallback((updater: (f: FormField[]) => FormField[]) => {
        setDraft((d) => ({ ...d, fields: updater(d.fields) }));
    }, []);

    // --- Persistence ---
    const saveDraft = async () => {
        if (!draft.name.trim() || draft.fields.length === 0 || busy) return;
        setBusy(true);
        setError(null);
        try {
            if (draft.id) {
                const res = await blockApi.update(draft.id, { name: draft.name.trim(), fields: draft.fields, isPublic: draft.isPublic });
                setBlocks((prev) => prev.map((b) => (b.id === draft.id ? res.data : b)));
                flash("Componente actualizado");
            } else {
                const res = await blockApi.create({ name: draft.name.trim(), fields: draft.fields, isPublic: draft.isPublic });
                setBlocks((prev) => [res.data, ...prev]);
                setDraft((d) => ({ ...d, id: res.data.id }));
                flash("Componente guardado");
            }
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    };

    const openBlock = (b: FieldBlockDto) =>
        setDraft({ id: b.id, name: b.name, isPublic: b.isPublic, fields: mapAIFields(b.fields) });

    const deleteBlock = async (id: number) => {
        try {
            await blockApi.remove(id);
            setBlocks((prev) => prev.filter((b) => b.id !== id));
            if (draft.id === id) setDraft(emptyDraft());
        } catch (e: any) { setError(e.message); }
    };

    const togglePublic = async (b: FieldBlockDto) => {
        try {
            await blockApi.update(b.id, { isPublic: !b.isPublic });
            setBlocks((prev) => prev.map((x) => (x.id === b.id ? { ...x, isPublic: !x.isPublic } : x)));
        } catch (e: any) { setError(e.message); }
    };

    const loadPublic = async () => {
        if (publicBlocks) { setPublicBlocks(null); return; }
        try { setPublicBlocks((await blockApi.getPublic()).data); }
        catch (e: any) { setError(e.message); }
    };

    const addPublic = async (id: number) => {
        try {
            const res = await blockApi.addPublic(id);
            setBlocks((prev) => [res.data, ...prev]);
            setPublicBlocks((prev) => prev?.filter((b) => b.id !== id) ?? null);
            flash("Añadido a tu biblioteca");
        } catch (e: any) { setError(e.message); }
    };

    const createWithAI = async () => {
        if (!aiPrompt.trim() || aiBusy) return;
        setAiBusy(true);
        setError(null);
        try {
            const res = await formApi.aiChat(
                [{ role: "user", content: `Creá SOLO los campos para este componente compuesto reutilizable. Usá visibleWhen/hiddenWhen para la lógica condicional entre campos cuando aplique: ${aiPrompt.trim()}` }],
                { title: "Componente", fields: [], styles: {} },
            );
            const data = res.data;
            if (data?.action === "update_schema" && data.fields?.length) {
                setDraft((d) => ({ ...d, fields: [...d.fields, ...mapAIFields(data.fields)] }));
                setAiPrompt("");
                flash("Campos generados — revisá la lógica y guardá");
            } else {
                setError(data?.reply || "La IA no devolvió campos.");
            }
        } catch (e: any) { setError(e.message); }
        finally { setAiBusy(false); }
    };

    return (
        <div className="flex gap-4 w-full" style={{ minHeight: "calc(100vh - 100px)" }}>
            {/* ─── Left: library ─── */}
            <aside className="w-64 shrink-0 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-base font-bold arbo-text">Componentes</h1>
                    <button onClick={() => setDraft(emptyDraft())} className="arbo-btn arbo-btn-primary text-xs py-1.5 px-2.5">
                        <Plus className="size-3.5" /> Nuevo
                    </button>
                </div>
                <p className="text-[11px] arbo-text-muted -mt-1">
                    Bloques de campos con lógica, listos para insertar desde el editor (panel +).
                </p>

                <div className="flex flex-col gap-1.5 overflow-y-auto">
                    {blocks.length === 0 && <p className="text-[11px] arbo-text-muted">Todavía no tienes componentes guardados.</p>}
                    {blocks.map((b) => (
                        <div key={b.id}
                            onClick={() => openBlock(b)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                draft.id === b.id ? "border-[var(--arbo-accent)] bg-[var(--arbo-accent-subtle)]" : "border-[var(--arbo-border)] bg-[var(--arbo-surface-2)] hover:border-[var(--arbo-border-light)]"
                            }`}>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium arbo-text truncate">{b.name}</p>
                                <p className="text-[9px] arbo-text-muted">{b.fields.length} campo(s){b.sourceId ? " · añadido" : ""}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); togglePublic(b); }}
                                title={b.isPublic ? "Público" : "Privado"}
                                className={`p-1 rounded ${b.isPublic ? "text-[var(--arbo-accent)]" : "arbo-text-muted"}`}>
                                {b.isPublic ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteBlock(b.id); }}
                                className="p-1 rounded text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)]">
                                <TrashBin className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                <button onClick={loadPublic}
                    className="flex items-center gap-2 text-[11px] arbo-text-muted hover:text-[var(--arbo-accent)] transition-colors">
                    <Magnifier className="size-3.5" /> {publicBlocks ? "Ocultar públicos" : "Explorar componentes públicos"}
                </button>
                {publicBlocks && (
                    <div className="flex flex-col gap-1.5">
                        {publicBlocks.length === 0 ? <p className="text-[10px] arbo-text-muted">No hay públicos todavía.</p> :
                            publicBlocks.map((b) => (
                                <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] arbo-text truncate">{b.name}</p>
                                        <p className="text-[9px] arbo-text-muted truncate">{b.fields.length} campo(s) · de {b.user?.name || b.user?.email}</p>
                                    </div>
                                    <button onClick={() => addPublic(b.id)}
                                        className="px-2 py-1 rounded-md text-[10px] text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]">Añadir</button>
                                </div>
                            ))}
                    </div>
                )}
            </aside>

            {/* ─── Right: builder ─── */}
            <main className="flex-1 min-w-0 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        placeholder="Nombre del componente (ej: Pregunta de alergias)"
                        className="flex-1 min-w-60 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm focus:border-[var(--arbo-accent)] focus:outline-none"
                    />
                    <label className="flex items-center gap-1.5 text-xs arbo-text-muted cursor-pointer">
                        <input type="checkbox" checked={draft.isPublic} onChange={(e) => setDraft((d) => ({ ...d, isPublic: e.target.checked }))} className="accent-[var(--arbo-accent)]" />
                        Público
                    </label>
                    <button onClick={saveDraft} disabled={busy || !draft.name.trim() || draft.fields.length === 0}
                        className="arbo-btn arbo-btn-primary text-xs disabled:opacity-50">
                        {busy ? "Guardando..." : draft.id ? "Actualizar" : "Guardar componente"}
                    </button>
                    {msg && <span className="text-xs text-[var(--arbo-accent)]">{msg}</span>}
                </div>
                {error && <p className="text-xs text-[var(--arbo-danger)]">{error}</p>}

                {/* Palette */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider mr-1">Agregar campo:</span>
                    {palette.map((p) => (
                        <button key={`${p.componentType}-${p.type}`} onClick={() => addField(p)}
                            className="px-2 py-1 rounded-md text-[10px] bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-muted hover:text-[var(--arbo-accent)] hover:border-[var(--arbo-accent)]/40 transition-colors">
                            {p.icon} {p.label}
                        </button>
                    ))}
                </div>

                {/* AI */}
                <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[var(--arbo-accent)] shrink-0" />
                    <input
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createWithAI()}
                        placeholder='Crear con IA: ej. "pregunta sí/no de alergias; si responde Sí mostrar cuáles y gravedad"'
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs focus:border-[var(--arbo-accent)] focus:outline-none"
                    />
                    <button onClick={createWithAI} disabled={aiBusy || !aiPrompt.trim()} className="arbo-btn arbo-btn-secondary text-xs disabled:opacity-50">
                        {aiBusy ? "Generando..." : "Generar"}
                    </button>
                </div>

                {/* Field quick-edit chips — draggable to reorder */}
                {draft.fields.length > 0 && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
                        <SortableContext items={draft.fields.map((f) => f.name)} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-1.5">
                                {draft.fields.map((f) => (
                                    <SortableField key={f.name} id={f.name}>
                                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                                            <input
                                                value={f.label || ""}
                                                onChange={(e) => updateField(f.name, { label: e.target.value })}
                                                className="w-48 px-2 py-1 rounded bg-[var(--arbo-surface-3)] border border-transparent focus:border-[var(--arbo-accent)] arbo-text text-[11px] focus:outline-none"
                                            />
                                            <span className="text-[9px] arbo-text-muted font-mono shrink-0">{f.componentType}</span>
                                            {OPTION_COMPONENTS.includes(f.componentType) && (
                                                <OptionsInput
                                                    value={f.options || []}
                                                    onCommit={(opts) => updateField(f.name, { options: opts })}
                                                />
                                            )}
                                            <select
                                                value={f.span ?? 12}
                                                onChange={(e) => updateField(f.name, { span: Number(e.target.value) })}
                                                title="Ancho del campo al insertar en formulario con grid"
                                                className="px-1.5 py-1 rounded bg-[var(--arbo-surface-3)] border border-transparent focus:border-[var(--arbo-accent)] arbo-text text-[10px] shrink-0 focus:outline-none"
                                            >
                                                {SPAN_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                                            </select>
                                            <label className="flex items-center gap-1 text-[10px] arbo-text-muted ml-auto shrink-0 cursor-pointer">
                                                <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(f.name, { required: e.target.checked })} className="accent-[var(--arbo-accent)]" />
                                                Oblig.
                                            </label>
                                            <button onClick={() => removeField(f.name)} className="p-1 rounded text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] shrink-0">
                                                <Xmark className="size-3" />
                                            </button>
                                        </div>
                                    </SortableField>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                {/* Nodes / Preview tabs */}
                <div className="flex items-center gap-1">
                    {([
                        { key: "nodes", label: "⚡ Nodos y lógica" },
                        { key: "preview", label: "👁 Vista previa (Form)" },
                    ] as { key: "nodes" | "preview"; label: string }[]).map((tab) => (
                        <button key={tab.key} onClick={() => setView(tab.key)}
                            className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border border-b-0 ${
                                view === tab.key
                                    ? "bg-[var(--arbo-surface-2)] text-[var(--arbo-accent)] border-[var(--arbo-border)]"
                                    : "bg-transparent arbo-text-muted border-transparent hover:arbo-text"
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Logic canvas / interactive preview */}
                <div className="flex-1 rounded-xl rounded-tl-none border border-[var(--arbo-border)] overflow-hidden -mt-3" style={{ minHeight: 420 }}>
                    {draft.fields.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-sm arbo-text-muted text-center px-8">
                                Agregá campos con la paleta o con IA.<br />
                                Después arrastrá desde el punto verde de un campo hasta otro para conectar la lógica
                                (clic en la flecha para elegir la respuesta y si muestra u oculta).
                            </p>
                        </div>
                    ) : view === "nodes" ? (
                        <LogicFlowEditor fields={draft.fields} onFieldsChange={onFieldsChange} />
                    ) : (
                        <BlockPreview fields={draft.fields} />
                    )}
                </div>
            </main>
        </div>
    );
};
