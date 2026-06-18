import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import { SquarePlus, Eye, Pencil } from "@gravity-ui/icons";

export const PortalDashboard = () => {
    const { project, projectId } = usePortal();
    const navigate = useNavigate();
    const forms = project?.forms || project?.userForms || project?.UserForms || [];
    const [responseCounts, setResponseCounts] = useState<Record<number, number>>({});

    useEffect(() => {
        const load = async () => {
            const results = await Promise.all(
                forms.map((f: any) =>
                    formApi.getResponseCount(f.id)
                        .then((r) => ({ id: f.id, count: r.data.count }))
                        .catch(() => ({ id: f.id, count: 0 }))
                )
            );
            setResponseCounts(Object.fromEntries(results.map((r) => [r.id, r.count])));
        };
        if (forms.length) load();
    }, [forms.length]);

    const totalResponses = Object.values(responseCounts).reduce((a, b) => a + b, 0);
    const published = forms.filter((f: any) => f.isPublished).length;

    return (
        <div className="flex flex-col gap-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Formularios", value: forms.length, sub: `${published} publicados` },
                    { label: "Respuestas totales", value: totalResponses, sub: "acumuladas" },
                    { label: "Colaboradores", value: project?.collaborators?.length ?? 0, sub: "con acceso" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="rounded-xl p-5 flex flex-col gap-1"
                        style={{ background: "var(--arbo-surface-2)", border: "1px solid var(--arbo-border)" }}
                    >
                        <p className="text-2xl font-bold" style={{ color: "var(--arbo-accent)" }}>{s.value}</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>{s.label}</p>
                        <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Recent forms */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--arbo-text-muted)" }}>
                        Formularios recientes
                    </h2>
                    <button
                        onClick={() => navigate(`/p/${projectId}/forms`)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: "var(--arbo-accent)" }}
                    >
                        Ver todos →
                    </button>
                </div>

                {forms.length === 0 ? (
                    <div
                        className="rounded-xl p-12 flex flex-col items-center gap-4 text-center"
                        style={{ background: "var(--arbo-surface-2)", border: "1px dashed var(--arbo-border)" }}
                    >
                        <p className="text-sm" style={{ color: "var(--arbo-text-muted)" }}>No hay formularios en este proyecto todavía.</p>
                        <button
                            onClick={() => navigate(`/p/${projectId}/forms`)}
                            className="arbo-btn arbo-btn-primary text-sm"
                        >
                            <SquarePlus className="size-4" /> Crear formulario
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {forms.slice(0, 6).map((form: any) => {
                            const fieldCount = form.fields?.length || form.FormFields?.length || 0;
                            const accent = form.styles?.gradient || form.styles?.accentColor || "var(--arbo-accent)";
                            return (
                                <div
                                    key={form.id}
                                    className="rounded-xl overflow-hidden flex flex-col group"
                                    style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
                                >
                                    <div className="h-1.5 w-full" style={{ background: accent }} />
                                    <div className="px-4 py-3 flex flex-col gap-2 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold truncate" style={{ color: "var(--arbo-text)" }}>{form.title}</p>
                                            <span
                                                className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                                                style={{
                                                    background: form.isPublished ? "rgba(74,222,128,0.15)" : "rgba(245,158,11,0.15)",
                                                    color: form.isPublished ? "var(--arbo-accent)" : "var(--arbo-warning)",
                                                }}
                                            >
                                                {form.isPublished ? "Publicado" : "Borrador"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                                            <span>{fieldCount} campos</span>
                                            <span>{responseCounts[form.id] ?? 0} respuestas</span>
                                        </div>
                                    </div>
                                    <div
                                        className="flex border-t px-3 py-2 gap-1"
                                        style={{ borderColor: "var(--arbo-border)" }}
                                    >
                                        <button
                                            onClick={() => navigate(`/form-builder/edit/${form.id}`)}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-colors hover:bg-[var(--arbo-surface-2)]"
                                            style={{ color: "var(--arbo-text-secondary)" }}
                                        >
                                            <Pencil className="size-3" /> Editar
                                        </button>
                                        <button
                                            onClick={() => navigate(`/form-builder/responses/${form.id}`)}
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg transition-colors hover:bg-[var(--arbo-surface-2)]"
                                            style={{ color: "var(--arbo-text-secondary)" }}
                                        >
                                            <Eye className="size-3" /> Respuestas
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
