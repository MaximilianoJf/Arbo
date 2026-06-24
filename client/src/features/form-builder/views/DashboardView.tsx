import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, SquarePlus, ChevronDown, ChevronUp } from "@gravity-ui/icons";
import { formApi, ragApi } from "@/services/api";
import { FormCard } from "../components/FormCard";

type RagStatus = "none" | "ready" | "stale";
interface RagSource { textSnippet: string; score: number; }

// ─── Main view: only the user's forms (projects live in their own view) ───
export const DashboardView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Group RAG state ──
    const [ragStatus, setRagStatus] = useState<RagStatus>("none");
    const [ragBuilding, setRagBuilding] = useState(false);
    const [ragBuildMsg, setRagBuildMsg] = useState<string | null>(null);
    const [ragBuildError, setRagBuildError] = useState<string | null>(null);
    const [ragQuery, setRagQuery] = useState("");
    const [ragQuerying, setRagQuerying] = useState(false);
    const [ragResult, setRagResult] = useState<{ answer: string; sources: RagSource[] } | null>(null);
    const [ragError, setRagError] = useState<string | null>(null);
    const [ragOpen, setRagOpen] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await formApi.getMyForms();
            // Only loose forms here — forms inside a project live under "Mis Proyectos".
            setForms((res.data || []).filter((f: any) => !f.project && f.projectId == null));
        } catch {
            navigate("/");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        ragApi.getUserStatus()
            .then((res) => setRagStatus((res.data?.ragStatus || "none") as RagStatus))
            .catch(() => {});
    }, []);

    const handleBuildRag = async () => {
        setRagBuilding(true);
        setRagBuildMsg(null);
        setRagBuildError(null);
        try {
            const res = await ragApi.buildUser();
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
            const res = await ragApi.queryUser(ragQuery.trim());
            setRagResult(res.data);
        } catch (err: any) {
            setRagError(err.message || "Error al consultar el RAG");
        } finally {
            setRagQuerying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    const totalForms = forms.length;

    const statusBadge = {
        none:  { label: "Sin RAG",           cls: "bg-[var(--arbo-surface-2)] arbo-text-muted" },
        ready: { label: "RAG listo",          cls: "bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)]" },
        stale: { label: "RAG desactualizado", cls: "bg-[rgba(245,158,11,0.15)] text-[var(--arbo-warning)]" },
    } as const;

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold arbo-text">{t("dashboard.myForms")}</h1>
                    <p className="text-sm arbo-text-muted mt-0.5">
                        {totalForms} {totalForms === 1 ? "formulario" : "formularios"}
                    </p>
                </div>
                <button
                    onClick={() => navigate("/form-builder/create-form")}
                    className="arbo-btn arbo-btn-primary text-sm shrink-0"
                >
                    <SquarePlus className="size-4" />
                    {t("nav.newForm")}
                </button>
            </div>

            {/* ── Group RAG panel (only when there are forms) ── */}
            {totalForms > 0 && (
                <div className="arbo-panel overflow-hidden">
                    <button
                        onClick={() => setRagOpen((v) => !v)}
                        className="w-full arbo-panel-header flex items-center justify-between cursor-pointer hover:bg-[var(--arbo-surface-2)] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-[var(--arbo-accent)]" />
                            <span className="font-semibold">Análisis IA del grupo</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge[ragStatus].cls}`}>
                                {statusBadge[ragStatus].label}
                            </span>
                        </div>
                        {ragOpen
                            ? <ChevronUp className="size-4 arbo-text-muted" />
                            : <ChevronDown className="size-4 arbo-text-muted" />}
                    </button>

                    {ragOpen && (
                        <div className="p-5 flex flex-col gap-4">
                            <p className="text-sm arbo-text-muted">
                                Construí un índice semántico con todas tus respuestas y consultá el conjunto completo con lenguaje natural.
                            </p>

                            {/* Build */}
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
                                        ? "Crear RAG del grupo"
                                        : "Reconstruir RAG"}
                                </button>
                                {ragBuildMsg && <span className="text-xs text-[var(--arbo-accent)]">{ragBuildMsg}</span>}
                                {ragBuildError && <span className="text-xs text-[var(--arbo-danger)]">{ragBuildError}</span>}
                            </div>

                            {/* Query — only when RAG exists */}
                            {(ragStatus === "ready" || ragStatus === "stale") && (
                                <div className="flex flex-col gap-3">
                                    {ragStatus === "stale" && (
                                        <p className="text-xs text-[var(--arbo-warning)]">
                                            Se agregaron nuevas respuestas. Reconstruí el RAG para incluirlas.
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={ragQuery}
                                            onChange={(e) => setRagQuery(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleQueryRag(); }}
                                            placeholder="¿Qué querés saber sobre el conjunto de respuestas?"
                                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted focus:outline-none focus:border-[var(--arbo-accent)]"
                                        />
                                        <button
                                            onClick={handleQueryRag}
                                            disabled={ragQuerying || !ragQuery.trim()}
                                            className="arbo-btn arbo-btn-primary text-sm disabled:opacity-50 shrink-0"
                                        >
                                            {ragQuerying ? "Consultando…" : "Analizar con RAG"}
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
            )}

            {/* Empty state */}
            {totalForms === 0 ? (
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
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {forms.map((form) => (
                        <FormCard key={form.id} form={form} onAction={load} variant="active" />
                    ))}
                </div>
            )}
        </div>
    );
};
