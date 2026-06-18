import { useCallback, useEffect, useState } from "react";
import { Plus, TrashBin, Globe, Lock, Magnifier, Sparkles as SparklesIcon } from "@gravity-ui/icons";
import { blockApi, formApi, type FieldBlockDto } from "@/services/api";
import { prepareBlockFields } from "../../utils/block-insert";
import { mapAIFields } from "../../utils/ai-field-mapper";
import { useEditorContext } from "./EditorContext";

/**
 * User library of composite components (field groups with conditional logic).
 * Lists own blocks (including ones added from other users), lets you insert
 * them into the form, share/unshare, browse public ones, and create via AI.
 */
export const BlockLibrary = () => {
    const { schema, setSchema, currentPageNumber } = useEditorContext();
    const [blocks, setBlocks] = useState<FieldBlockDto[]>([]);
    const [publicBlocks, setPublicBlocks] = useState<FieldBlockDto[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // AI creation
    const [showAI, setShowAI] = useState(false);
    const [aiName, setAiName] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiBusy, setAiBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await blockApi.getMine();
            setBlocks(res.data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const insertBlock = (block: FieldBlockDto) => {
        setSchema((prev) => {
            const existing = prev.fields.map((f) => f.name);
            const prepared = prepareBlockFields(block.fields, existing, currentPageNumber, prev.fields.length, block.name);
            return { ...prev, fields: [...prev.fields, ...prepared] };
        });
    };

    const togglePublic = async (block: FieldBlockDto) => {
        try {
            await blockApi.update(block.id, { isPublic: !block.isPublic });
            setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, isPublic: !b.isPublic } : b)));
        } catch (e: any) { setError(e.message); }
    };

    const removeBlock = async (id: number) => {
        try {
            await blockApi.remove(id);
            setBlocks((prev) => prev.filter((b) => b.id !== id));
        } catch (e: any) { setError(e.message); }
    };

    const loadPublic = async () => {
        if (publicBlocks) { setPublicBlocks(null); return; }
        try {
            const res = await blockApi.getPublic();
            setPublicBlocks(res.data);
        } catch (e: any) { setError(e.message); }
    };

    const addPublic = async (id: number) => {
        try {
            const res = await blockApi.addPublic(id);
            setBlocks((prev) => [res.data, ...prev]);
            setPublicBlocks((prev) => prev?.filter((b) => b.id !== id) ?? null);
        } catch (e: any) { setError(e.message); }
    };

    const createWithAI = async () => {
        if (!aiPrompt.trim() || !aiName.trim() || aiBusy) return;
        setAiBusy(true);
        setError(null);
        try {
            const res = await formApi.aiChat(
                [{
                    role: "user",
                    content: `Creá SOLO los campos (sin estilos globales) para este componente compuesto reutilizable. Usá visibleWhen para la lógica condicional entre los campos cuando aplique: ${aiPrompt.trim()}`,
                }],
                { title: aiName.trim(), fields: [], styles: {} },
            );
            const data = res.data;
            if (data?.action === "update_schema" && data.fields?.length) {
                const fields = mapAIFields(data.fields);
                const created = await blockApi.create({
                    name: aiName.trim(),
                    description: aiPrompt.trim().slice(0, 300),
                    fields,
                });
                setBlocks((prev) => [created.data, ...prev]);
                setShowAI(false); setAiName(""); setAiPrompt("");
            } else {
                setError(data?.reply || "La IA no devolvió campos. Probá con más detalle.");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setAiBusy(false);
        }
    };

    const blockRow = (b: FieldBlockDto, actions: React.ReactNode) => (
        <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium arbo-text truncate">{b.name}</p>
                <p className="text-[9px] arbo-text-muted truncate">
                    {b.fields.length} campo(s)
                    {b.fields.some((f: any) => f.visibleWhen?.length) ? " · con lógica" : ""}
                    {b.user ? ` · de ${b.user.name || b.user.email}` : b.sourceId ? " · añadido" : ""}
                </p>
            </div>
            {actions}
        </div>
    );

    return (
        <div className="mt-3 pt-3 border-t border-[var(--arbo-border)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Mis componentes</p>
                <div className="flex items-center gap-1">
                    <button onClick={() => setShowAI((v) => !v)} title="Crear componente con IA"
                        className={`p-1.5 rounded-md transition-colors ${showAI ? "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]" : "arbo-text-muted hover:text-[var(--arbo-accent)]"}`}>
                        <SparklesIcon className="size-3.5" />
                    </button>
                    <button onClick={loadPublic} title="Explorar componentes públicos de otros usuarios"
                        className={`p-1.5 rounded-md transition-colors ${publicBlocks ? "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]" : "arbo-text-muted hover:text-[var(--arbo-accent)]"}`}>
                        <Magnifier className="size-3.5" />
                    </button>
                </div>
            </div>

            {/* AI creation */}
            {showAI && (
                <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-accent)]/30">
                    <input value={aiName} onChange={(e) => setAiName(e.target.value)} placeholder="Nombre del componente"
                        className="w-full px-2 py-1.5 rounded bg-[var(--arbo-surface-3)] border border-[var(--arbo-border)] arbo-text text-[11px] focus:border-[var(--arbo-accent)] focus:outline-none" />
                    <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={3}
                        placeholder='Ej: pregunta "¿Tenés alergias?" sí/no; si responde Sí, mostrar campos "Cuáles" y "Gravedad"'
                        className="w-full px-2 py-1.5 rounded bg-[var(--arbo-surface-3)] border border-[var(--arbo-border)] arbo-text text-[11px] resize-none focus:border-[var(--arbo-accent)] focus:outline-none" />
                    <button onClick={createWithAI} disabled={aiBusy || !aiName.trim() || !aiPrompt.trim()}
                        className="arbo-btn arbo-btn-primary text-[11px] py-1.5 disabled:opacity-50">
                        {aiBusy ? "Generando..." : "Crear con IA"}
                    </button>
                </div>
            )}

            {error && <p className="text-[10px] text-[var(--arbo-danger)]">{error}</p>}

            {/* Own blocks */}
            {loading ? (
                <p className="text-[10px] arbo-text-muted">Cargando…</p>
            ) : blocks.length === 0 ? (
                <p className="text-[10px] arbo-text-muted leading-relaxed">
                    Todavía no guardaste componentes. Armá campos con lógica en la pestaña <strong className="arbo-text">Lógica</strong> y guardalos como componente, o crealos con IA (✨).
                </p>
            ) : (
                blocks.map((b) => blockRow(b, (
                    <>
                        <button onClick={() => togglePublic(b)} title={b.isPublic ? "Público — clic para hacerlo privado" : "Privado — clic para compartirlo"}
                            className={`p-1.5 rounded-md transition-colors shrink-0 ${b.isPublic ? "text-[var(--arbo-accent)]" : "arbo-text-muted hover:arbo-text"}`}>
                            {b.isPublic ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
                        </button>
                        <button onClick={() => removeBlock(b.id)} title="Eliminar de mi biblioteca"
                            className="p-1.5 rounded-md text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] transition-colors shrink-0">
                            <TrashBin className="size-3.5" />
                        </button>
                        <button onClick={() => insertBlock(b)} title="Insertar en el formulario"
                            className="p-1.5 rounded-md text-[var(--arbo-accent)] hover:bg-[var(--arbo-accent-muted)] transition-colors shrink-0">
                            <Plus className="size-3.5" />
                        </button>
                    </>
                )))
            )}

            {/* Public blocks browser */}
            {publicBlocks && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider mt-1">Públicos de otros usuarios</p>
                    {publicBlocks.length === 0 ? (
                        <p className="text-[10px] arbo-text-muted">No hay componentes públicos todavía.</p>
                    ) : (
                        publicBlocks.map((b) => blockRow(b, (
                            <button onClick={() => addPublic(b.id)} title="Añadir a mi biblioteca"
                                className="px-2 py-1 rounded-md text-[10px] font-medium text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)] hover:opacity-80 transition-opacity shrink-0">
                                Añadir
                            </button>
                        )))
                    )}
                </div>
            )}
        </div>
    );
};
