import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectApi, formApi, ragApi } from "@/services/api";
import { Pencil, TrashBin, Persons, Eye, ArrowRight, LayoutHeaderCells, Sparkles, ChevronDown, ChevronUp } from "@gravity-ui/icons";

const ROLE_OPTIONS = [
    { value: "viewer", label: "Viewer" },
    { value: "editor", label: "Editor" },
];

// ─── Mini form preview (CSS-only, no iframe) ───
const FormMiniPreview = ({ form, onAnswer, onEdit, onResponses }: {
    form: any;
    onAnswer: () => void;
    onEdit: () => void;
    onResponses: () => void;
}) => {
    const styles = form.styles || {};
    const accent = styles.gradient || styles.accentColor || "var(--arbo-accent)";
    const cardBg = styles.bgColor || "#1a1a24";
    const fieldCount = form.fields?.length || form.FormFields?.length || 0;
    return (
        <div className="arbo-glass arbo-glass-hover group relative w-full rounded-2xl overflow-hidden">
            {/* Mini preview area — click to open the form */}
            <button onClick={onAnswer} className="block w-full text-left">
                <div
                    className="w-full aspect-[4/3] p-3 flex flex-col items-center justify-center gap-1.5 relative overflow-hidden"
                    style={{ background: styles.pageBgColor || "var(--arbo-bg)" }}
                >
                    {/* Tiny card representation */}
                    <div
                        className="w-[80%] rounded-md overflow-hidden shadow-sm"
                        style={{
                            background: cardBg,
                            border: `1px solid ${styles.borderColor || "rgba(255,255,255,0.08)"}`,
                            borderRadius: `${Math.min(styles.borderRadius ?? 14, 8)}px`,
                        }}
                    >
                        <div className="h-1" style={{ background: accent }} />
                        <div className="px-2 py-1.5 flex flex-col gap-0.5">
                            <div className="h-1 w-[65%] rounded-full bg-white/20" />
                            <div className="h-0.5 w-[45%] rounded-full bg-white/10" />
                        </div>
                    </div>
                    <div
                        className="w-[80%] rounded-md p-2 flex flex-col gap-1"
                        style={{
                            background: cardBg,
                            border: `1px solid ${styles.borderColor || "rgba(255,255,255,0.08)"}`,
                            borderRadius: `${Math.min(styles.borderRadius ?? 14, 8)}px`,
                        }}
                    >
                        {[...Array(Math.min(fieldCount || 2, 3))].map((_, i) => (
                            <div key={i} className="flex flex-col gap-0.5">
                                <div className="h-0.5 w-[40%] rounded-full bg-white/15" />
                                <div
                                    className="h-2 w-full rounded-sm"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                                />
                            </div>
                        ))}
                        <div className="flex justify-end mt-0.5">
                            <div className="h-1.5 w-6 rounded-sm" style={{ background: accent }} />
                        </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                            <ArrowRight className="size-3.5 text-white" />
                            <span className="text-xs text-white font-medium">Contestar</span>
                        </div>
                    </div>
                </div>
            </button>

            {/* Info strip */}
            <div className="px-3 py-2.5 border-t border-white/10">
                <p className="text-xs font-semibold arbo-text truncate">{form.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] arbo-text-muted">{fieldCount} campos</span>
                    <span className="text-[var(--arbo-border-light)]">&bull;</span>
                    <span className={`text-[10px] ${form.isPublished ? "text-[var(--arbo-accent)]" : "text-[var(--arbo-warning)]"}`}>
                        {form.isPublished ? "Publicado" : "Borrador"}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-2">
                    <button
                        onClick={onAnswer}
                        title="Abrir el formulario para responderlo"
                        className="arbo-btn arbo-btn-primary text-[11px] px-2.5 py-1 flex-1"
                    >
                        <ArrowRight className="size-3" /> Contestar
                    </button>
                    <button
                        onClick={onResponses}
                        title="Ver respuestas"
                        className="arbo-btn arbo-btn-ghost text-[11px] px-2 py-1"
                    >
                        <LayoutHeaderCells className="size-3" />
                    </button>
                    <button
                        onClick={onEdit}
                        title="Editar formulario"
                        className="arbo-btn arbo-btn-ghost text-[11px] px-2 py-1"
                    >
                        <Pencil className="size-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Collaborators panel ───
const CollabPanel = ({ projectId, isOwner }: { projectId: number; isOwner: boolean }) => {
    const [collabs, setCollabs] = useState<any[]>([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("editor");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await projectApi.getCollaborators(projectId);
            setCollabs(res.data);
        } catch { /* silent */ }
    }, [projectId]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setError("");
        try {
            await projectApi.addCollaborator(projectId, email.trim(), role);
            setEmail("");
            load();
        } catch (err: any) {
            setError(err.message || "Error al agregar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold arbo-text-muted uppercase tracking-wider flex items-center gap-2">
                <Persons className="size-3.5" />
                Colaboradores ({collabs.length})
            </h3>

            {isOwner && (
                <div className="flex flex-col gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@ejemplo.com"
                        className="arbo-input text-xs w-full"
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <div className="flex gap-2">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="arbo-input flex-1 text-xs"
                        >
                            {ROLE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAdd}
                            disabled={loading}
                            className="arbo-btn arbo-btn-primary text-xs px-4"
                        >
                            {loading ? "..." : "Agregar"}
                        </button>
                    </div>
                </div>
            )}

            {error && <p className="text-xs text-[var(--arbo-danger)]">{error}</p>}

            {collabs.length === 0 ? (
                <p className="text-xs arbo-text-muted text-center py-3">Sin colaboradores aún</p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {collabs.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[var(--arbo-surface-2)]">
                            <div className="size-6 rounded-full bg-[var(--arbo-accent-muted)] flex items-center justify-center text-[10px] font-bold arbo-text-accent shrink-0">
                                {(c.user?.name || c.email)?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium arbo-text truncate">
                                    {c.user?.name || c.email}
                                </p>
                            </div>
                            {isOwner ? (
                                <>
                                    <select
                                        value={c.role}
                                        onChange={async (e) => {
                                            try {
                                                await projectApi.updateCollaboratorRole(projectId, c.email, e.target.value);
                                                load();
                                            } catch {}
                                        }}
                                        className="arbo-input text-[10px] w-16 py-0.5"
                                    >
                                        {ROLE_OPTIONS.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await projectApi.removeCollaborator(projectId, c.email);
                                                load();
                                            } catch {}
                                        }}
                                        className="text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] p-1 rounded transition-colors"
                                    >
                                        <TrashBin className="size-3" />
                                    </button>
                                </>
                            ) : (
                                <span className="text-[10px] arbo-text-muted capitalize">{c.role}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Assign form modal ───
const AssignFormModal = ({ open, projectId, existingFormIds, onClose, onAssigned }: {
    open: boolean;
    projectId: number;
    existingFormIds: number[];
    onClose: () => void;
    onAssigned: () => void;
}) => {
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        formApi.getMyForms()
            .then((res) => setForms(res.data.filter((f: any) => !existingFormIds.includes(f.id))))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [open, existingFormIds]);

    const handleAssign = async (formId: number) => {
        try {
            await projectApi.assignForm(formId, projectId);
            onAssigned();
            onClose();
        } catch { /* silent */ }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="arbo-card-static w-full max-w-md p-6 mx-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold arbo-text mb-1">Agregar formulario</h3>
                <p className="text-xs arbo-text-muted mb-4">Selecciona un formulario para agregar al proyecto</p>

                {loading ? (
                    <div className="flex items-center justify-center py-8"><div className="arbo-spinner" /></div>
                ) : forms.length === 0 ? (
                    <p className="text-sm arbo-text-muted text-center py-8">No hay formularios disponibles</p>
                ) : (
                    <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                        {forms.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => handleAssign(f.id)}
                                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--arbo-surface-2)] hover:bg-[var(--arbo-surface-3)] transition-colors text-left group"
                            >
                                {/* Mini accent bar */}
                                <div className="w-1 h-8 rounded-full shrink-0"
                                    style={{ background: f.styles?.gradient || f.styles?.accentColor || "var(--arbo-accent)" }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium arbo-text truncate">{f.title}</p>
                                    <p className="text-[10px] arbo-text-muted">{f.fields?.length || 0} campos</p>
                                </div>
                                <ArrowRight className="size-4 arbo-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex justify-end mt-4 pt-3 border-t border-[var(--arbo-border)]">
                    <button onClick={onClose} className="arbo-btn arbo-btn-ghost text-sm">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ─── Delete confirmation modal ───
const DeleteProjectModal = ({
    open, projectName, formCount, onCancel, onConfirm,
}: {
    open: boolean;
    projectName: string;
    formCount: number;
    onCancel: () => void;
    onConfirm: (deleteForms: boolean) => void;
}) => {
    const [deleting, setDeleting] = useState(false);

    const handle = async (deleteForms: boolean) => {
        setDeleting(true);
        await onConfirm(deleteForms);
        setDeleting(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div
                className="arbo-card-static w-full max-w-sm p-6 mx-4 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold arbo-text">Eliminar proyecto</h3>
                    <p className="text-sm arbo-text-muted">
                        ¿Qué querés hacer con los <span className="font-medium arbo-text">{formCount} formulario{formCount !== 1 ? "s" : ""}</span> vinculados a <span className="font-medium arbo-text">"{projectName}"</span>?
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => handle(false)}
                        disabled={deleting}
                        className="arbo-btn arbo-btn-secondary text-sm w-full flex flex-col items-start gap-0.5 py-3 px-4 disabled:opacity-50"
                    >
                        <span className="font-semibold">Solo eliminar el proyecto</span>
                        <span className="text-xs arbo-text-muted font-normal">Los formularios quedan en tu cuenta, desvinculados.</span>
                    </button>
                    <button
                        onClick={() => handle(true)}
                        disabled={deleting}
                        className="arbo-btn text-sm w-full flex flex-col items-start gap-0.5 py-3 px-4 disabled:opacity-50"
                        style={{ background: "var(--arbo-danger-muted)", color: "var(--arbo-danger)", border: "1px solid color-mix(in srgb, var(--arbo-danger) 30%, transparent)" }}
                    >
                        <span className="font-semibold">Eliminar proyecto y formularios</span>
                        <span className="text-xs font-normal opacity-70">Borra también los {formCount} formularios y todas sus respuestas. Irreversible.</span>
                    </button>
                </div>

                <button onClick={onCancel} disabled={deleting} className="arbo-btn arbo-btn-ghost text-sm w-full">
                    Cancelar
                </button>
            </div>
        </div>
    );
};

// ─── Main view ───
export const ProjectDetailView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [showAssign, setShowAssign] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    // ── Project RAG state ──
    const [ragStatus, setRagStatus] = useState<"none" | "ready" | "stale">("none");
    const [ragOpen, setRagOpen] = useState(false);
    const [ragBuilding, setRagBuilding] = useState(false);
    const [ragBuildMsg, setRagBuildMsg] = useState<string | null>(null);
    const [ragBuildError, setRagBuildError] = useState<string | null>(null);
    const [ragQuery, setRagQuery] = useState("");
    const [ragQuerying, setRagQuerying] = useState(false);
    const [ragResult, setRagResult] = useState<{ answer: string; sources: { textSnippet: string; score: number }[] } | null>(null);
    const [ragError, setRagError] = useState<string | null>(null);

    const projectId = Number(id);

    const load = useCallback(async () => {
        try {
            const res = await projectApi.getById(projectId);
            setProject(res.data);
            setEditName(res.data.name);
            setEditDesc(res.data.description || "");
        } catch {
            navigate("/form-builder/projects");
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!projectId) return;
        ragApi.getProjectStatus(projectId)
            .then((r) => setRagStatus((r.data?.ragStatus || "none") as "none" | "ready" | "stale"))
            .catch(() => {});
    }, [projectId]);

    const handleBuildRag = async () => {
        setRagBuilding(true);
        setRagBuildMsg(null);
        setRagBuildError(null);
        try {
            const res = await ragApi.buildProject(projectId);
            setRagStatus("ready");
            setRagBuildMsg(`RAG creado con ${res.data.indexed} vectores indexados.`);
            setRagResult(null);
        } catch (err: any) {
            setRagBuildError(err.message || "Error al construir el RAG");
        } finally {
            setRagBuilding(false);
        }
    };

    const handleQueryRag = async () => {
        if (!ragQuery.trim()) return;
        setRagQuerying(true);
        setRagError(null);
        try {
            const res = await ragApi.queryProject(projectId, ragQuery.trim());
            setRagResult(res.data);
        } catch (err: any) {
            setRagError(err.message || "Error al consultar el RAG");
        } finally {
            setRagQuerying(false);
        }
    };

    const isOwner = project?.user?.email === getTokenEmail();

    const handleSaveEdit = async () => {
        try {
            await projectApi.update(projectId, { name: editName, description: editDesc });
            setEditing(false);
            load();
        } catch { /* silent */ }
    };

    const handleDelete = async (deleteForms: boolean) => {
        try {
            await projectApi.delete(projectId, deleteForms);
            navigate("/form-builder");
        } catch (err: any) {
            alert(err?.message || "Error al eliminar el proyecto");
        }
    };

    const handleUnlinkForm = async (formId: number) => {
        try {
            await projectApi.assignForm(formId, null);
            load();
        } catch { /* silent */ }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    if (!project) return null;

    const forms = project.forms || project.userForms || project.UserForms || [];

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col gap-3">
                {/* Identity row — always visible */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/form-builder/projects")}
                        className="arbo-btn arbo-btn-ghost p-2 shrink-0"
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <div
                        className="size-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                        style={{ backgroundColor: project.color || "#4ADE80" }}
                    >
                        {project.name?.[0]?.toUpperCase() || "P"}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-base font-bold arbo-text truncate">{project.name}</h1>
                        {project.description && (
                            <p className="text-xs arbo-text-muted truncate">{project.description}</p>
                        )}
                    </div>

                    {!editing && (
                        <>
                            <button
                                onClick={() => navigate(`/p/${projectId}`)}
                                className="arbo-btn arbo-btn-primary text-xs shrink-0"
                                title="Abrir el portal SaaS de este proyecto"
                            >
                                Abrir portal
                            </button>
                            <button
                                onClick={() => navigate(`/form-builder/projects/${projectId}/relations`)}
                                className="arbo-btn arbo-btn-secondary text-xs shrink-0"
                                title="Conectar los formularios de este proyecto (uno a muchos)"
                            >
                                Configurar BD
                            </button>
                        </>
                    )}

                    {isOwner && !editing && (
                        <div className="flex gap-1 shrink-0">
                            <button onClick={() => setEditing(true)} className="arbo-btn arbo-btn-ghost p-2" title="Editar">
                                <Pencil className="size-4" />
                            </button>
                            <button
                                onClick={() => setShowDelete(true)}
                                className="arbo-btn arbo-btn-ghost p-2 text-[var(--arbo-danger)]"
                                title="Eliminar"
                            >
                                <TrashBin className="size-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Edit form — shown below the identity row */}
                {editing && (
                    <div className="arbo-card-static p-4 flex flex-col gap-3 ml-[52px]">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-semibold arbo-text-muted uppercase tracking-wider">Nombre</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="arbo-input text-sm font-medium"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-semibold arbo-text-muted uppercase tracking-wider">Descripción</label>
                            <input
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="arbo-input text-sm"
                                placeholder="Descripción opcional..."
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={handleSaveEdit} className="arbo-btn arbo-btn-primary text-xs px-4">
                                Guardar
                            </button>
                            <button onClick={() => setEditing(false)} className="arbo-btn arbo-btn-ghost text-xs">
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RAG panel ── */}
            {(() => {
                const ragBadge = {
                    none:  { label: "Sin RAG",           cls: "bg-[var(--arbo-surface-2)] arbo-text-muted" },
                    ready: { label: "RAG listo",          cls: "bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)]" },
                    stale: { label: "RAG desactualizado", cls: "bg-[rgba(245,158,11,0.15)] text-[var(--arbo-warning)]" },
                } as const;
                return (
                    <div className="arbo-panel overflow-hidden">
                        <button
                            onClick={() => setRagOpen((v) => !v)}
                            className="w-full arbo-panel-header flex items-center justify-between cursor-pointer hover:bg-[var(--arbo-surface-2)] transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-[var(--arbo-accent)]" />
                                <span className="font-semibold">Análisis IA con RAG</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ragBadge[ragStatus].cls}`}>
                                    {ragBadge[ragStatus].label}
                                </span>
                            </div>
                            {ragOpen
                                ? <ChevronUp className="size-4 arbo-text-muted" />
                                : <ChevronDown className="size-4 arbo-text-muted" />}
                        </button>

                        {ragOpen && (
                            <div className="p-5 flex flex-col gap-4">
                                <p className="text-sm arbo-text-muted">
                                    Indexá las respuestas del proyecto en un vector DB para hacer consultas semánticas sobre toda la BD relacional.
                                </p>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <button
                                        onClick={handleBuildRag}
                                        disabled={ragBuilding}
                                        className="arbo-btn arbo-btn-primary text-sm disabled:opacity-50"
                                    >
                                        <Sparkles className="size-4" />
                                        {ragBuilding
                                            ? "Construyendo RAG…"
                                            : ragStatus === "none"
                                            ? "Crear RAG de análisis"
                                            : "Reconstruir RAG"}
                                    </button>
                                    {ragBuildMsg && <span className="text-xs text-[var(--arbo-accent)]">{ragBuildMsg}</span>}
                                    {ragBuildError && <span className="text-xs text-[var(--arbo-danger)]">{ragBuildError}</span>}
                                </div>

                                {(ragStatus === "ready" || ragStatus === "stale") && (
                                    <div className="flex flex-col gap-3">
                                        {ragStatus === "stale" && (
                                            <p className="text-xs text-[var(--arbo-warning)]">
                                                Hay nuevas respuestas en el proyecto. Reconstruí el RAG para incluirlas.
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={ragQuery}
                                                onChange={(e) => setRagQuery(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") handleQueryRag(); }}
                                                placeholder="¿Qué querés analizar sobre este proyecto?"
                                                className="flex-1 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted focus:outline-none focus:border-[var(--arbo-accent)]"
                                            />
                                            <button
                                                onClick={handleQueryRag}
                                                disabled={ragQuerying || !ragQuery.trim()}
                                                className="arbo-btn arbo-btn-primary text-sm disabled:opacity-50 shrink-0"
                                            >
                                                {ragQuerying ? "Consultando…" : "Consultar RAG"}
                                            </button>
                                        </div>

                                        {ragError && <p className="text-xs text-[var(--arbo-danger)]">{ragError}</p>}

                                        {ragResult && (
                                            <div className="flex flex-col gap-3">
                                                <div className="p-4 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                                                    <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider mb-2">Respuesta</p>
                                                    <p className="text-sm arbo-text leading-relaxed whitespace-pre-wrap">{ragResult.answer}</p>
                                                </div>
                                                {ragResult.sources.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider mb-2">Fuentes</p>
                                                        <div className="flex flex-col gap-2">
                                                            {ragResult.sources.map((src, i) => (
                                                                <div key={i} className="px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] flex items-start gap-3">
                                                                    <span className="text-[10px] font-mono text-[var(--arbo-accent)] shrink-0 mt-0.5">
                                                                        {(src.score * 100).toFixed(0)}%
                                                                    </span>
                                                                    <p className="text-xs arbo-text-secondary leading-relaxed line-clamp-2">{src.textSnippet}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Main content — 2 columns */}
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                {/* Forms column */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-semibold arbo-text-muted uppercase tracking-wider">
                            Formularios ({forms.length})
                        </h2>
                        {isOwner && (
                            <button onClick={() => setShowAssign(true)} className="arbo-btn arbo-btn-ghost text-xs">
                                + Agregar
                            </button>
                        )}
                    </div>

                    {forms.length === 0 ? (
                        <div className="arbo-card-static flex flex-col items-center gap-4 p-12 text-center">
                            <div className="size-14 rounded-2xl bg-[var(--arbo-surface-2)] flex items-center justify-center">
                                <svg className="size-7 arbo-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <p className="text-sm arbo-text-muted">Este proyecto no tiene formularios</p>
                            {isOwner && (
                                <button onClick={() => setShowAssign(true)} className="arbo-btn arbo-btn-primary text-sm">
                                    Agregar formulario
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {forms.map((form: any) => (
                                <div key={form.id} className="relative group">
                                    <FormMiniPreview
                                        form={form}
                                        onAnswer={() => window.open(`/forms/${form.slug}`, "_blank")}
                                        onEdit={() => navigate(`/form-builder/edit/${form.id}`)}
                                        onResponses={() => navigate(`/form-builder/responses/${form.id}`)}
                                    />
                                    {isOwner && (
                                        <button
                                            onClick={() => handleUnlinkForm(form.id)}
                                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity
                                                       bg-black/50 backdrop-blur-sm p-1 rounded-md text-white/70 hover:text-[var(--arbo-danger)] hover:bg-black/70"
                                            title="Desvincular"
                                        >
                                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="h-fit">
                    <div className="arbo-card-static p-4">
                        <CollabPanel projectId={projectId} isOwner={isOwner} />
                    </div>
                </div>
            </div>

            <AssignFormModal
                open={showAssign}
                projectId={projectId}
                existingFormIds={forms.map((f: any) => f.id)}
                onClose={() => setShowAssign(false)}
                onAssigned={load}
            />

            <DeleteProjectModal
                open={showDelete}
                projectName={project.name}
                formCount={forms.length}
                onCancel={() => setShowDelete(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
};

/** Extract user email from JWT token */
function getTokenEmail(): string | null {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.email || null;
    } catch {
        return null;
    }
}
