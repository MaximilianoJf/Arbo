import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formApi } from "@/services/api";
import { FormCard } from "../components/FormCard";

type ProjectFilter = "all" | "none" | number;

export const DashboardView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ProjectFilter>("all");

    const load = useCallback(async () => {
        try {
            const res = await formApi.getMyForms();
            setForms(res.data);
        } catch {
            navigate("/");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { load(); }, [load]);

    const handleAction = () => { load(); };

    // Extract unique projects from forms for the filter
    const projects = useMemo(() => {
        const map = new Map<number, { id: number; name: string; color: string }>();
        for (const f of forms) {
            if (f.project) map.set(f.project.id, f.project);
        }
        return Array.from(map.values());
    }, [forms]);

    const filteredForms = useMemo(() => {
        if (filter === "all") return forms;
        if (filter === "none") return forms.filter((f) => !f.project && !f.projectId);
        return forms.filter((f) => f.project?.id === filter || f.projectId === filter);
    }, [forms, filter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold arbo-text">{t("dashboard.myForms")}</h1>
                    <p className="text-sm arbo-text-muted mt-0.5">
                        {t("dashboard.formsCreated", { count: forms.length })}
                    </p>
                </div>
            </div>

            {/* Project filter chips */}
            {projects.length > 0 && (
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
                    {projects.map((p) => (
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
                                className="size-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: filter === p.id ? "white" : p.color }}
                            />
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {forms.length === 0 ? (
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
            ) : filteredForms.length === 0 ? (
                <div className="arbo-card-static flex flex-col items-center gap-4 p-12 text-center">
                    <p className="text-sm arbo-text-muted">
                        {t("dashboard.noFormsFilter")}
                    </p>
                    <button
                        onClick={() => setFilter("all")}
                        className="arbo-btn arbo-btn-ghost text-sm"
                    >
                        {t("dashboard.viewAll")}
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredForms.map((form) => (
                        <FormCard key={form.id} form={form} onAction={handleAction} variant="active" />
                    ))}
                </div>
            )}
        </div>
    );
};
