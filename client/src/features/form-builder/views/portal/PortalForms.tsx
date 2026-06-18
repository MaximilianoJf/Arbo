import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectApi, formApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import { SquarePlus, Pencil, Eye, TrashBin, Xmark, FileText, Sparkles } from "@gravity-ui/icons";

const CreateFormModal = ({ open, projectId, onClose, onCreated }: {
    open: boolean; projectId: number; onClose: () => void; onCreated: () => void;
}) => {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const navigate = useNavigate();

    const handleCreate = async () => {
        if (!title.trim()) return setErr("El nombre es requerido");
        setLoading(true);
        setErr("");
        try {
            const res = await formApi.create({ title: title.trim(), description: "", fields: [], onSubmit: "SaveToDB" });
            await projectApi.assignForm(res.data.id, projectId);
            onCreated();
            onClose();
            navigate(`/form-builder/edit/${res.data.id}`);
        } catch (e: any) {
            setErr(e.message || "Error al crear formulario");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-sm mx-4 rounded-2xl p-6 flex flex-col gap-4"
                style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold" style={{ color: "var(--arbo-text)" }}>Nuevo formulario</h3>
                    <button onClick={onClose} style={{ color: "var(--arbo-text-muted)" }}>
                        <Xmark className="size-4" />
                    </button>
                </div>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Nombre del formulario"
                    className="arbo-input w-full"
                    autoFocus
                />
                {err && <p className="text-xs text-[var(--arbo-danger)]">{err}</p>}
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="arbo-btn arbo-btn-ghost text-sm">Cancelar</button>
                    <button onClick={handleCreate} disabled={loading} className="arbo-btn arbo-btn-primary text-sm disabled:opacity-50">
                        {loading ? "Creando..." : "Crear y editar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PortalForms = () => {
    const { project, projectId, reload, isOwner } = usePortal();
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState("");
    const forms: any[] = project?.forms || project?.userForms || project?.UserForms || [];
    const filtered = forms.filter((f) => f.title?.toLowerCase().includes(search.toLowerCase()));

    const handleUnlink = async (formId: number) => {
        if (!confirm("¿Desvincular este formulario del proyecto?")) return;
        await projectApi.assignForm(formId, null);
        reload();
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar formularios..."
                    className="arbo-input flex-1 text-sm"
                />
                {isOwner && (
                    <button onClick={() => setShowCreate(true)} className="arbo-btn arbo-btn-primary text-sm shrink-0">
                        <SquarePlus className="size-4" /> Nuevo formulario
                    </button>
                )}
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div
                    className="rounded-xl p-16 flex flex-col items-center gap-4 text-center"
                    style={{ background: "var(--arbo-surface-2)", border: "1px dashed var(--arbo-border)" }}
                >
                    <p className="text-sm" style={{ color: "var(--arbo-text-muted)" }}>
                        {search ? "No hay coincidencias." : "No hay formularios. Creá el primero."}
                    </p>
                    {!search && isOwner && (
                        <button onClick={() => setShowCreate(true)} className="arbo-btn arbo-btn-primary text-sm">
                            <SquarePlus className="size-4" /> Crear formulario
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {filtered.map((form) => {
                        const fieldCount = form.fields?.length || form.FormFields?.length || 0;
                        const accent = form.styles?.gradient || form.styles?.accentColor || "var(--arbo-accent)";
                        return (
                            <div
                                key={form.id}
                                className="flex items-center gap-4 rounded-xl px-4 py-3"
                                style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
                            >
                                <div className="w-1 h-10 rounded-full shrink-0" style={{ background: accent }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: "var(--arbo-text)" }}>{form.title}</p>
                                    <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>{fieldCount} campos</p>
                                </div>
                                <span
                                    className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                                    style={{
                                        background: form.isPublished ? "rgba(74,222,128,0.15)" : "rgba(245,158,11,0.15)",
                                        color: form.isPublished ? "var(--arbo-accent)" : "var(--arbo-warning)",
                                    }}
                                >
                                    {form.isPublished ? "Publicado" : "Borrador"}
                                </span>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => navigate(`/form-builder/edit/${form.id}`)}
                                        className="p-2 rounded-lg transition-colors hover:bg-[var(--arbo-surface-2)]"
                                        style={{ color: "var(--arbo-text-muted)" }}
                                        title="Editar formulario"
                                    >
                                        <Pencil className="size-3.5" />
                                    </button>
                                    <button
                                        onClick={() => navigate(`/p/${projectId}/responses`)}
                                        className="p-2 rounded-lg transition-colors hover:bg-[var(--arbo-surface-2)]"
                                        style={{ color: "var(--arbo-text-muted)" }}
                                        title="Ver respuestas en el portal"
                                    >
                                        <FileText className="size-3.5" />
                                    </button>
                                    <button
                                        onClick={() => navigate(`/p/${projectId}/analysis`)}
                                        className="p-2 rounded-lg transition-colors hover:bg-[var(--arbo-surface-2)]"
                                        style={{ color: "var(--arbo-text-muted)" }}
                                        title="Analizar con IA"
                                    >
                                        <Sparkles className="size-3.5" />
                                    </button>
                                    <button
                                        onClick={() => window.open(`/forms/${form.slug}`, "_blank")}
                                        className="p-2 rounded-lg transition-colors hover:bg-[var(--arbo-surface-2)]"
                                        style={{ color: "var(--arbo-text-muted)" }}
                                        title="Ver formulario público"
                                    >
                                        <Eye className="size-3.5" />
                                    </button>
                                    {isOwner && (
                                        <button
                                            onClick={() => handleUnlink(form.id)}
                                            className="p-2 rounded-lg transition-colors hover:bg-[var(--arbo-danger-muted)]"
                                            style={{ color: "var(--arbo-text-muted)" }}
                                            title="Desvincular"
                                        >
                                            <TrashBin className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <CreateFormModal
                open={showCreate}
                projectId={projectId}
                onClose={() => setShowCreate(false)}
                onCreated={reload}
            />
        </div>
    );
};
