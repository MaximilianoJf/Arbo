import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formApi, projectApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import { SquarePlus, FileText, ArrowRight } from "@gravity-ui/icons";

const relTime = (iso?: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "recién";
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return `hace ${d} d`;
};

export const PortalDashboard = () => {
    const { project, projectId, isOwner } = usePortal();
    const navigate = useNavigate();
    const forms: any[] = project?.forms || project?.userForms || project?.UserForms || [];
    const projectColor = project?.color || "var(--arbo-accent)";
    const owner = project?.user;

    const [counts, setCounts] = useState<Record<number, number>>({});
    const [collabs, setCollabs] = useState<any[]>([]);

    useEffect(() => {
        if (!forms.length) return;
        Promise.all(forms.map((f) =>
            formApi.getResponseCount(f.id).then((r) => ({ id: f.id, count: r.data.count })).catch(() => ({ id: f.id, count: 0 }))
        )).then((res) => setCounts(Object.fromEntries(res.map((r) => [r.id, r.count]))));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [forms.length]);

    useEffect(() => {
        projectApi.getCollaborators(projectId).then((r) => setCollabs(r.data || [])).catch(() => {});
    }, [projectId]);

    const totalResponses = Object.values(counts).reduce((a, b) => a + b, 0);
    const published = forms.filter((f) => f.isPublished).length;
    const recentForms = [...forms].sort((a, b) => +new Date(b.updatedAt || 0) - +new Date(a.updatedAt || 0));

    return (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            {/* ── Main column ── */}
            <div className="flex flex-col gap-5">
                {/* Hero: Resumen de Impacto */}
                <div className="arbo-glass rounded-2xl p-6 relative overflow-hidden">
                    <span className="absolute right-5 top-1 arbo-font-display text-7xl font-extrabold pointer-events-none select-none" style={{ color: "rgba(255,255,255,0.04)" }}>
                        DATA
                    </span>
                    <p className="text-sm font-semibold arbo-text mb-1">Resumen de Impacto</p>
                    <p className="text-sm arbo-text-muted max-w-md mb-5">
                        Este proyecto acumula <span className="arbo-text font-medium">{totalResponses}</span> respuesta{totalResponses !== 1 ? "s" : ""} en{" "}
                        <span className="arbo-text font-medium">{forms.length}</span> formulario{forms.length !== 1 ? "s" : ""}.
                    </p>
                    <div className="flex gap-10">
                        <div>
                            <p className="arbo-font-display text-3xl font-bold arbo-text-accent leading-none">{totalResponses}</p>
                            <p className="text-[10px] uppercase tracking-wider arbo-text-muted mt-1">Respuestas</p>
                        </div>
                        <div>
                            <p className="arbo-font-display text-3xl font-bold leading-none" style={{ color: "var(--arbo-violet)" }}>{forms.length}</p>
                            <p className="text-[10px] uppercase tracking-wider arbo-text-muted mt-1">Formularios</p>
                        </div>
                        <div>
                            <p className="arbo-font-display text-3xl font-bold arbo-text-accent leading-none">{published}</p>
                            <p className="text-[10px] uppercase tracking-wider arbo-text-muted mt-1">Publicados</p>
                        </div>
                    </div>
                </div>

                {/* Form cards bento */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {forms.map((form) => {
                        const fieldCount = form.fields?.length || form.FormFields?.length || 0;
                        return (
                            <div key={form.id} className="arbo-glass arbo-glass-hover rounded-2xl p-5 flex flex-col gap-3 min-h-[170px]">
                                <div className="flex items-start justify-between">
                                    <div className="size-11 rounded-xl flex items-center justify-center" style={{ background: "var(--arbo-accent-muted)", border: "1px solid var(--arbo-accent)" }}>
                                        <FileText className="size-5 arbo-text-accent" />
                                    </div>
                                    <span
                                        className="text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide border"
                                        style={form.isPublished
                                            ? { background: "var(--arbo-accent-muted)", color: "var(--arbo-accent)", borderColor: "rgba(74,222,128,0.3)" }
                                            : { background: "rgba(255,255,255,0.06)", color: "var(--arbo-text-muted)", borderColor: "rgba(255,255,255,0.15)" }}
                                    >
                                        {form.isPublished ? "Activo" : "Borrador"}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold arbo-text leading-tight mb-1">{form.title}</h3>
                                    <p className="text-xs arbo-text-muted">
                                        {form.updatedAt ? `Última edición ${relTime(form.updatedAt)}` : `${fieldCount} campos`}
                                    </p>
                                </div>
                                <div className="flex items-end justify-between border-t border-white/10 pt-3">
                                    <div>
                                        <p className="text-lg font-bold arbo-text leading-none">{counts[form.id] ?? 0}</p>
                                        <p className="text-[10px] arbo-text-muted">Respuestas</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/form-builder/edit/${form.id}`)}
                                        className="flex items-center gap-1 text-xs font-semibold arbo-text-accent hover:underline"
                                    >
                                        Abrir <ArrowRight className="size-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Create-from-template card */}
                    <button
                        onClick={() => navigate(`/p/${projectId}/forms`)}
                        className="rounded-2xl flex flex-col items-center justify-center gap-2 min-h-[170px] border border-dashed transition-colors"
                        style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)" }}
                    >
                        <div className="size-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <SquarePlus className="size-5 arbo-text-muted" />
                        </div>
                        <span className="text-sm arbo-text-muted">Crear formulario</span>
                    </button>
                </div>
            </div>

            {/* ── Right rail ── */}
            <div className="flex flex-col gap-5">
                {/* Colaboradores */}
                <div className="arbo-glass rounded-2xl p-5">
                    <h3 className="text-sm font-bold arbo-text mb-4">Colaboradores</h3>
                    <div className="flex flex-col gap-3">
                        {owner && (
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: projectColor, color: "#fff" }}>
                                    {(owner.name || owner.email)?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium arbo-text truncate">{owner.name || owner.email}</p>
                                    <p className="text-[11px] arbo-text-muted">Propietario</p>
                                </div>
                            </div>
                        )}
                        {collabs.map((c) => (
                            <div key={c.id} className="flex items-center gap-3">
                                <div className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-text-secondary)" }}>
                                    {(c.user?.name || c.email)?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium arbo-text truncate">{c.user?.name || c.email}</p>
                                    <p className="text-[11px] arbo-text-muted capitalize">{c.role}</p>
                                </div>
                            </div>
                        ))}
                        {collabs.length === 0 && !owner && (
                            <p className="text-xs arbo-text-muted">Sin colaboradores todavía.</p>
                        )}
                    </div>
                    {isOwner && (
                        <button
                            onClick={() => navigate(`/p/${projectId}/users`)}
                            className="arbo-btn arbo-btn-secondary w-full text-xs mt-4"
                        >
                            Invitar equipo
                        </button>
                    )}
                </div>

                {/* Actividad reciente (formularios por última edición) */}
                <div className="arbo-glass rounded-2xl p-5">
                    <h3 className="text-sm font-bold arbo-text mb-4">Actividad reciente</h3>
                    {recentForms.length === 0 ? (
                        <p className="text-xs arbo-text-muted">Sin actividad.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recentForms.slice(0, 5).map((f) => (
                                <div key={f.id} className="flex items-start gap-2.5">
                                    <span className="size-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "var(--arbo-accent)" }} />
                                    <div className="min-w-0">
                                        <p className="text-xs arbo-text truncate">
                                            <span className="font-medium">{f.title}</span>{" "}
                                            <span className="arbo-text-muted">{f.isPublished ? "publicado" : "actualizado"}</span>
                                        </p>
                                        <p className="text-[10px] arbo-text-muted">{relTime(f.updatedAt) || "—"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
