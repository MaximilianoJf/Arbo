import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { projectApi } from "@/services/api";
import { SquarePlus } from "@gravity-ui/icons";

const PROJECT_COLORS = [
    "#4ADE80", "#60A5FA", "#F472B6", "#FBBF24",
    "#A78BFA", "#FB923C", "#34D399", "#F87171",
];

interface CreateProjectModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const CreateProjectModal = ({ open, onClose, onCreated }: CreateProjectModalProps) => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="arbo-card-static w-full max-w-md p-6 mx-4 animate-[fadeInUp_0.2s_ease-out]"
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

interface ProjectCardProps {
    project: any;
    role?: string;
    onClick: () => void;
}

const ProjectCard = ({ project, role, onClick }: ProjectCardProps) => {
    const formCount = project.forms?.length ?? project.userForms?.length ?? project.UserForms?.length ?? 0;

    return (
        <button
            onClick={onClick}
            className="arbo-card group text-left p-5 flex flex-col gap-3 transition-all hover:scale-[1.01]"
        >
            <div className="flex items-start justify-between">
                <div
                    className="size-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: project.color || "#4ADE80" }}
                >
                    {project.name?.[0]?.toUpperCase() || "P"}
                </div>
                {role && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--arbo-accent-muted)] arbo-text-accent uppercase tracking-wider">
                        {role}
                    </span>
                )}
            </div>
            <div>
                <h3 className="font-semibold arbo-text truncate">{project.name}</h3>
                {project.description && (
                    <p className="text-sm arbo-text-muted mt-0.5 line-clamp-2">{project.description}</p>
                )}
            </div>
            <div className="flex items-center gap-3 mt-auto pt-1">
                <span className="text-xs arbo-text-muted">
                    {formCount} form{formCount !== 1 ? "s" : ""}
                </span>
                {project.user && (
                    <span className="text-xs arbo-text-muted">
                        por {project.user.name || project.user.email}
                    </span>
                )}
            </div>
        </button>
    );
};

export const ProjectsView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [owned, setOwned] = useState<any[]>([]);
    const [shared, setShared] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await projectApi.getAll();
            setOwned(res.data.owned);
            setShared(res.data.shared);
        } catch {
            navigate("/");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    const totalProjects = owned.length + shared.length;

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold arbo-text">{t("projects.title")}</h1>
                    <p className="text-sm arbo-text-muted mt-0.5">
                        {t("projects.projects", { count: totalProjects })}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="arbo-btn arbo-btn-primary"
                >
                    <SquarePlus className="size-4" />
                    {t("projects.newProject")}
                </button>
            </div>

            {totalProjects === 0 ? (
                <div className="arbo-card-static flex flex-col items-center gap-5 p-16 text-center">
                    <div className="size-16 rounded-2xl bg-[var(--arbo-accent-muted)] flex items-center justify-center">
                        <svg className="size-8 text-[var(--arbo-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-lg font-semibold arbo-text">{t("projects.noProjects")}</p>
                        <p className="text-sm arbo-text-muted mt-1">
                            {t("projects.noProjectsSubtitle")}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="arbo-btn arbo-btn-primary"
                    >
                        {t("projects.createProject")}
                    </button>
                </div>
            ) : (
                <>
                    {owned.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold arbo-text-muted uppercase tracking-wider mb-3">
                                {t("projects.myProjects")}
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {owned.map((p) => (
                                    <ProjectCard
                                        key={p.id}
                                        project={p}
                                        onClick={() => navigate(`/form-builder/projects/${p.id}`)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {shared.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold arbo-text-muted uppercase tracking-wider mb-3">
                                {t("projects.sharedWithMe")}
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {shared.map((p) => (
                                    <ProjectCard
                                        key={p.id}
                                        project={p}
                                        role={p.role}
                                        onClick={() => navigate(`/form-builder/projects/${p.id}`)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}

            <CreateProjectModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={load}
            />
        </div>
    );
};
