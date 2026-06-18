import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formApi, projectApi } from "@/services/api";
import { FormCard } from "../components/FormCard";
import { SquarePlus, ArrowRight } from "@gravity-ui/icons";

const PROJECT_COLORS = [
    "#4ADE80", "#60A5FA", "#F472B6", "#FBBF24",
    "#A78BFA", "#FB923C", "#34D399", "#F87171",
];

// ─── Create Project Modal ───────────────────────────────────────────────────
const CreateProjectModal = ({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(PROJECT_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!name.trim()) return setError("El nombre es requerido");
        setLoading(true);
        setError("");
        try {
            await projectApi.create({ name: name.trim(), description: description.trim(), color });
            setName("");
            setDescription("");
            setColor(PROJECT_COLORS[0]);
            onCreated();
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al crear proyecto");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="arbo-card-static w-full max-w-md p-6 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold arbo-text mb-4">{t("projects.newProject")}</h3>
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-medium arbo-text-muted mb-1 block">{t("projects.name")}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("projects.namePlaceholder")}
                            className="arbo-input w-full"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium arbo-text-muted mb-1 block">{t("projects.descriptionOptional")}</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("projects.descriptionPlaceholder")}
                            className="arbo-input w-full resize-none h-20"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium arbo-text-muted mb-2 block">{t("projects.color")}</label>
                        <div className="flex gap-2">
                            {PROJECT_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className="size-8 rounded-full transition-all"
                                    style={{
                                        backgroundColor: c,
                                        boxShadow: color === c ? `0 0 0 2px var(--arbo-bg), 0 0 0 4px ${c}` : "none",
                                        transform: color === c ? "scale(1.1)" : "scale(1)",
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-sm text-[var(--arbo-danger)]">{error}</p>}

                    <div className="flex gap-2 justify-end mt-2">
                        <button onClick={onClose} className="arbo-btn arbo-btn-ghost">
                            {t("common.cancel")}
                        </button>
                        <button onClick={handleSubmit} disabled={loading} className="arbo-btn arbo-btn-primary">
                            {loading ? t("projects.creating") : t("projects.createProject")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Project section ────────────────────────────────────────────────────────
const ProjectSection = ({
    project,
    forms,
    onAction,
    onNavigate,
    isShared,
}: {
    project: any;
    forms: any[];
    onAction: () => void;
    onNavigate: (path: string) => void;
    isShared?: boolean;
}) => (
    <div className="flex flex-col gap-3">
        {/* Project header */}
        <div className="flex items-center gap-2.5">
            <div
                className="size-7 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: project.color || "#4ADE80" }}
            >
                {project.name?.[0]?.toUpperCase() || "P"}
            </div>
            <span className="font-semibold arbo-text text-sm truncate">{project.name}</span>
            {isShared && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--arbo-accent-muted)] arbo-text-accent uppercase tracking-wider shrink-0">
                    {project.role || "colaborador"}
                </span>
            )}
            <span className="text-xs arbo-text-muted shrink-0">
                {forms.length} {forms.length === 1 ? "formulario" : "formularios"}
            </span>
            <button
                onClick={() => onNavigate(`/form-builder/projects/${project.id}`)}
                className="ml-auto arbo-btn arbo-btn-ghost text-xs flex items-center gap-1 shrink-0"
            >
                Ver proyecto
                <ArrowRight className="size-3" />
            </button>
        </div>

        {/* Forms grid */}
        {forms.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {forms.map((form) => (
                    <FormCard key={form.id} form={form} onAction={onAction} variant="active" />
                ))}
            </div>
        ) : (
            <div className="flex items-center justify-center p-6 rounded-xl border border-dashed border-[var(--arbo-border)] arbo-text-muted text-sm">
                Sin formularios en este proyecto
            </div>
        )}
    </div>
);

// ─── Main view ──────────────────────────────────────────────────────────────
type Filter = "all" | "none" | number;

export const DashboardView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [forms, setForms] = useState<any[]>([]);
    const [ownedProjects, setOwnedProjects] = useState<any[]>([]);
    const [sharedProjects, setSharedProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>("all");
    const [showCreateProject, setShowCreateProject] = useState(false);

    const load = useCallback(async () => {
        try {
            const [formsRes, projectsRes] = await Promise.all([
                formApi.getMyForms(),
                projectApi.getAll(),
            ]);
            setForms(formsRes.data);
            setOwnedProjects(projectsRes.data.owned ?? []);
            setSharedProjects(projectsRes.data.shared ?? []);
        } catch {
            navigate("/");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { load(); }, [load]);

    const allProjects = useMemo(() => [...ownedProjects, ...sharedProjects], [ownedProjects, sharedProjects]);

    // Group forms by projectId
    const formsByProjectId = useMemo(() => {
        const map = new Map<number, any[]>();
        for (const f of forms) {
            const pid = f.project?.id ?? f.projectId;
            if (pid) {
                if (!map.has(pid)) map.set(pid, []);
                map.get(pid)!.push(f);
            }
        }
        return map;
    }, [forms]);

    const looseForms = useMemo(
        () => forms.filter((f) => !f.project && !f.projectId),
        [forms]
    );

    // Filter chip projects (derived from forms that have a project attached)
    const projectChips = useMemo(() => {
        const seen = new Set<number>();
        const result: { id: number; name: string; color: string }[] = [];
        for (const f of forms) {
            if (f.project && !seen.has(f.project.id)) {
                seen.add(f.project.id);
                result.push(f.project);
            }
        }
        return result;
    }, [forms]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    const totalForms = forms.length;
    const hasContent = totalForms > 0 || allProjects.length > 0;

    // Flat filtered forms (when a specific filter is active)
    const flatFilteredForms =
        filter === "none"
            ? looseForms
            : typeof filter === "number"
            ? (formsByProjectId.get(filter) ?? [])
            : [];

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold arbo-text">{t("dashboard.myForms")}</h1>
                    <p className="text-sm arbo-text-muted mt-0.5">
                        {totalForms} {totalForms === 1 ? "formulario" : "formularios"}
                        {allProjects.length > 0 && (
                            <> &middot; {allProjects.length} {allProjects.length === 1 ? "proyecto" : "proyectos"}</>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowCreateProject(true)}
                        className="arbo-btn arbo-btn-secondary text-sm"
                    >
                        <SquarePlus className="size-4" />
                        Nuevo Proyecto
                    </button>
                    <button
                        onClick={() => navigate("/form-builder/create-form")}
                        className="arbo-btn arbo-btn-primary text-sm"
                    >
                        <SquarePlus className="size-4" />
                        {t("nav.newForm")}
                    </button>
                </div>
            </div>

            {/* Filter chips — only when there are projects */}
            {allProjects.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter("all")}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all border ${
                            filter === "all"
                                ? "bg-[var(--arbo-accent)] text-white border-[var(--arbo-accent)]"
                                : "arbo-text-muted border-[var(--arbo-border)] hover:border-[var(--arbo-border-light)]"
                        }`}
                    >
                        {t("dashboard.all")}
                    </button>
                    {looseForms.length > 0 && (
                        <button
                            onClick={() => setFilter("none")}
                            className={`text-xs px-3 py-1.5 rounded-full transition-all border ${
                                filter === "none"
                                    ? "bg-[var(--arbo-surface-3)] arbo-text border-[var(--arbo-border-light)]"
                                    : "arbo-text-muted border-[var(--arbo-border)] hover:border-[var(--arbo-border-light)]"
                            }`}
                        >
                            {t("dashboard.noProject")}
                        </button>
                    )}
                    {projectChips.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setFilter(p.id)}
                            className={`text-xs px-3 py-1.5 rounded-full transition-all border flex items-center gap-1.5 ${
                                filter === p.id
                                    ? "text-white border-transparent"
                                    : "arbo-text-muted border-[var(--arbo-border)] hover:border-[var(--arbo-border-light)]"
                            }`}
                            style={filter === p.id ? { backgroundColor: p.color } : {}}
                        >
                            <span
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: filter === p.id ? "white" : p.color }}
                            />
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Empty state total */}
            {!hasContent && (
                <div className="arbo-card-static flex flex-col items-center gap-5 p-16 text-center">
                    <div className="size-16 rounded-2xl bg-[var(--arbo-accent-muted)] flex items-center justify-center">
                        <svg className="size-8 text-[var(--arbo-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-lg font-semibold arbo-text">{t("dashboard.noForms")}</p>
                        <p className="text-sm arbo-text-muted mt-1">{t("dashboard.noFormsSubtitle")}</p>
                    </div>
                    <button
                        onClick={() => navigate("/form-builder/create-form")}
                        className="arbo-btn arbo-btn-primary"
                    >
                        {t("dashboard.createForm")}
                    </button>
                </div>
            )}

            {/* Grouped view (filter === "all") */}
            {filter === "all" && hasContent && (
                <div className="flex flex-col gap-8">
                    {/* Project sections */}
                    {allProjects.map((project) => (
                        <ProjectSection
                            key={project.id}
                            project={project}
                            forms={formsByProjectId.get(project.id) ?? []}
                            onAction={load}
                            onNavigate={navigate}
                            isShared={sharedProjects.some((p) => p.id === project.id)}
                        />
                    ))}

                    {/* Loose forms section */}
                    {looseForms.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {allProjects.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xs font-semibold arbo-text-muted uppercase tracking-wider">
                                        Sin proyecto
                                    </h2>
                                    <span className="text-xs arbo-text-muted">({looseForms.length})</span>
                                </div>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {looseForms.map((form) => (
                                    <FormCard key={form.id} form={form} onAction={load} variant="active" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Flat filtered view */}
            {filter !== "all" && (
                flatFilteredForms.length === 0 ? (
                    <div className="arbo-card-static flex flex-col items-center gap-4 p-12 text-center">
                        <p className="text-sm arbo-text-muted">{t("dashboard.noFormsFilter")}</p>
                        <button onClick={() => setFilter("all")} className="arbo-btn arbo-btn-ghost text-sm">
                            {t("dashboard.viewAll")}
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {flatFilteredForms.map((form) => (
                            <FormCard key={form.id} form={form} onAction={load} variant="active" />
                        ))}
                    </div>
                )
            )}

            <CreateProjectModal
                open={showCreateProject}
                onClose={() => setShowCreateProject(false)}
                onCreated={load}
            />
        </div>
    );
};
