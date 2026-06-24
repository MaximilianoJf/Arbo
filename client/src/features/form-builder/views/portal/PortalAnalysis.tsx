import { useState, useCallback, useMemo } from "react";
import { formApi, ragApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import { Sparkles, ChevronDown, ChevronUp, Database, Magnifier, TriangleExclamation, CircleCheck } from "@gravity-ui/icons";

// ─── Shared helpers ──────────────────────────────────────────────────────────

const Section = ({ title, content }: { title: string; content: any }) => {
    const [open, setOpen] = useState(true);
    if (!content) return null;
    return (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--arbo-border)" }}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                style={{ background: "var(--arbo-surface-2)" }}
            >
                <span className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>{title}</span>
                {open ? <ChevronUp className="size-4" style={{ color: "var(--arbo-text-muted)" }} />
                       : <ChevronDown className="size-4" style={{ color: "var(--arbo-text-muted)" }} />}
            </button>
            {open && (
                <div className="px-4 py-3" style={{ background: "var(--arbo-surface)" }}>
                    {typeof content === "string" ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--arbo-text-secondary)" }}>{content}</p>
                    ) : Array.isArray(content) ? (
                        <ul className="flex flex-col gap-1">
                            {content.map((item: any, i: number) => (
                                <li key={i} className="text-sm flex gap-2" style={{ color: "var(--arbo-text-secondary)" }}>
                                    <span style={{ color: "var(--arbo-accent)" }}>·</span>
                                    <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <pre className="text-xs overflow-x-auto" style={{ color: "var(--arbo-text-secondary)" }}>
                            {JSON.stringify(content, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};

const RagBadge = ({ status }: { status: string }) => {
    if (status === "ready") return (
        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(74,222,128,0.15)", color: "var(--arbo-accent)" }}>
            <CircleCheck className="size-3" /> Listo
        </span>
    );
    if (status === "stale") return (
        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
            <TriangleExclamation className="size-3" /> Desactualizado
        </span>
    );
    return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--arbo-surface-2)", color: "var(--arbo-text-muted)" }}>
            Sin RAG
        </span>
    );
};

// ─── Main component ──────────────────────────────────────────────────────────

export const PortalAnalysis = () => {
    const { project, projectId, reload } = usePortal();
    const isDatabase: boolean = project?.isDatabase || false;
    const forms: any[] = project?.forms || project?.userForms || project?.UserForms || [];

    // Form selector — solo para análisis clásico; el RAG siempre es a nivel proyecto
    const [selectedFormId, setSelectedFormId] = useState<number | null>(forms[0]?.id ?? null);

    // RAG state — siempre opera a nivel proyecto (flat para sueltos, nested para BD relacional)
    const [ragBuilding, setRagBuilding] = useState(false);
    const [ragBuildError, setRagBuildError] = useState<string | null>(null);
    const [ragBuildMsg, setRagBuildMsg] = useState<string | null>(null);
    const [ragQuery, setRagQuery] = useState("");
    const [ragResult, setRagResult] = useState<{ answer: string; sources: { textSnippet: string; score: number }[] } | null>(null);
    const [ragQuerying, setRagQuerying] = useState(false);
    const [ragQueryError, setRagQueryError] = useState<string | null>(null);

    // Classic analysis state
    const [prompt, setPrompt] = useState("");
    const [classicResult, setClassicResult] = useState<any>(null);
    const [classicLoading, setClassicLoading] = useState(false);
    const [classicError, setClassicError] = useState<string | null>(null);

    // RAG status viene siempre del proyecto
    const ragStatus: string = useMemo(() => project?.ragStatus || "none", [project]);

    // ── RAG: build (siempre a nivel proyecto) ───────────────────────────────

    const handleBuildRag = useCallback(async () => {
        if (ragBuilding) return;
        setRagBuilding(true);
        setRagBuildError(null);
        setRagBuildMsg(null);
        try {
            const res = await ragApi.buildProject(projectId);
            setRagBuildMsg(`✓ ${res.data.indexed} respuestas indexadas correctamente`);
            await reload();
        } catch (e: any) {
            setRagBuildError(e.message || "Error al construir el RAG");
        } finally {
            setRagBuilding(false);
        }
    }, [ragBuilding, projectId, reload]);

    // ── RAG: query ──────────────────────────────────────────────────────────

    const handleQueryRag = useCallback(async () => {
        if (ragQuerying || !ragQuery.trim()) return;
        setRagQuerying(true);
        setRagQueryError(null);
        setRagResult(null);
        try {
            const res = await ragApi.queryProject(projectId, ragQuery.trim());
            setRagResult(res.data);
        } catch (e: any) {
            setRagQueryError(e.message || "Error al consultar el RAG");
        } finally {
            setRagQuerying(false);
        }
    }, [ragQuerying, ragQuery, projectId]);

    // ── Classic analysis ─────────────────────────────────────────────────────

    const handleClassicAnalyze = useCallback(async () => {
        if (!selectedFormId || classicLoading) return;
        setClassicLoading(true);
        setClassicError(null);
        setClassicResult(null);
        try {
            const res = await formApi.analyzeResponses(selectedFormId, prompt.trim() || undefined);
            setClassicResult(res.data);
        } catch (e: any) {
            setClassicError(e.message || "Error al analizar");
        } finally {
            setClassicLoading(false);
        }
    }, [selectedFormId, prompt, classicLoading]);

    const renderClassicResult = (data: any) => {
        if (!data) return null;
        if (typeof data === "string") {
            return (
                <div className="rounded-xl p-4" style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--arbo-text-secondary)" }}>{data}</p>
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-3">
                {data.summary && <Section title="Resumen" content={data.summary} />}
                {data.insights && <Section title="Insights" content={data.insights} />}
                {data.trends && <Section title="Tendencias" content={data.trends} />}
                {data.recommendations && <Section title="Recomendaciones" content={data.recommendations} />}
                {data.sentiment && <Section title="Sentimiento" content={data.sentiment} />}
                {Object.entries(data)
                    .filter(([k]) => !["summary", "insights", "trends", "recommendations", "sentiment"].includes(k))
                    .map(([k, v]) => <Section key={k} title={k.charAt(0).toUpperCase() + k.slice(1)} content={v as any} />)}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-5 max-w-3xl">

            {/* Page header */}
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--arbo-text-muted)" }}>
                    Análisis con IA
                </h2>
                <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                    {isDatabase
                        ? "Analizá toda la base de datos relacional mediante RAG semántico o análisis clásico por IA."
                        : "Analizá todos los formularios del proyecto con RAG semántico (índice del proyecto completo) o consultá uno a uno con el análisis clásico."}
                </p>
            </div>

            {/* Form selector (always visible for standalone; for DB it controls only classic analysis) */}
            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--arbo-text-muted)" }}>
                    {isDatabase ? "Formulario (para análisis clásico)" : "Formulario"}
                </label>
                <select
                    value={selectedFormId ?? ""}
                    onChange={(e) => {
                        setSelectedFormId(Number(e.target.value));
                        setClassicResult(null);
                        if (!isDatabase) { setRagResult(null); setRagBuildMsg(null); setRagBuildError(null); }
                    }}
                    className="arbo-input text-sm w-full"
                >
                    {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
            </div>

            {/* ═══ RAG Panel ═══════════════════════════════════════════════════ */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--arbo-border)" }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3"
                     style={{ background: "var(--arbo-surface-2)", borderBottom: "1px solid var(--arbo-border)" }}>
                    <div className="flex items-center gap-2">
                        <Database className="size-4" style={{ color: "var(--arbo-accent)" }} />
                        <span className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>
                            RAG de análisis
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                              style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-text-muted)" }}>
                            {isDatabase ? "BD relacional" : "Grupo de formularios"}
                        </span>
                    </div>
                    <RagBadge status={ragStatus} />
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3" style={{ background: "var(--arbo-surface)" }}>
                    <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                        {isDatabase
                        ? "Genera embeddings de todas las cadenas de respuestas anidadas del proyecto y las indexa en Qdrant."
                        : "Genera embeddings de las respuestas de todos los formularios del proyecto y las indexa juntas en Qdrant."}
                    </p>

                    {ragStatus === "stale" && (
                        <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg"
                             style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
                            <TriangleExclamation className="size-3.5 mt-0.5 shrink-0" />
                            <span>Se agregaron respuestas nuevas. El índice está desactualizado — reconstruilo para reflejar los últimos datos.</span>
                        </div>
                    )}

                    <button
                        onClick={handleBuildRag}
                        disabled={ragBuilding || (!isDatabase && !selectedFormId)}
                        className="arbo-btn arbo-btn-primary text-sm self-start gap-2 disabled:opacity-50"
                    >
                        <Database className="size-4" />
                        {ragBuilding
                            ? "Indexando..."
                            : ragStatus === "none"
                                ? "Crear RAG de análisis"
                                : "Reconstruir RAG"}
                    </button>

                    {ragBuilding && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                            <div className="arbo-spinner size-3" />
                            Generando embeddings y subiendo a Qdrant…
                        </div>
                    )}

                    {ragBuildMsg && (
                        <p className="text-xs" style={{ color: "var(--arbo-accent)" }}>{ragBuildMsg}</p>
                    )}
                    {ragBuildError && (
                        <p className="text-xs" style={{ color: "var(--arbo-danger)" }}>{ragBuildError}</p>
                    )}
                </div>
            </div>

            {/* ═══ RAG Query Panel (visible when RAG exists) ═══════════════════ */}
            {ragStatus !== "none" && (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--arbo-border)" }}>
                    <div className="flex items-center gap-2 px-4 py-3"
                         style={{ background: "var(--arbo-surface-2)", borderBottom: "1px solid var(--arbo-border)" }}>
                        <Magnifier className="size-4" style={{ color: "var(--arbo-accent)" }} />
                        <span className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>
                            Consulta semántica (RAG)
                        </span>
                    </div>

                    <div className="p-4 flex flex-col gap-3" style={{ background: "var(--arbo-surface)" }}>
                        {ragStatus === "stale" && (
                            <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                                El índice está desactualizado pero podés consultarlo igualmente.
                            </p>
                        )}

                        <textarea
                            value={ragQuery}
                            onChange={(e) => setRagQuery(e.target.value)}
                            placeholder="¿Qué querés analizar? Ej: ¿Cuáles son los problemas más frecuentes?"
                            rows={2}
                            className="arbo-input w-full resize-none text-sm"
                        />

                        <button
                            onClick={handleQueryRag}
                            disabled={ragQuerying || !ragQuery.trim()}
                            className="arbo-btn arbo-btn-primary text-sm self-start gap-2 disabled:opacity-50"
                        >
                            <Sparkles className="size-4" />
                            {ragQuerying ? "Analizando..." : "Analizar con RAG"}
                        </button>

                        {ragQuerying && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                 style={{ background: "var(--arbo-surface-2)" }}>
                                <div className="arbo-spinner size-4" />
                                <p className="text-sm" style={{ color: "var(--arbo-text-muted)" }}>
                                    Buscando respuestas relevantes y generando análisis…
                                </p>
                            </div>
                        )}

                        {ragQueryError && (
                            <p className="text-sm" style={{ color: "var(--arbo-danger)" }}>{ragQueryError}</p>
                        )}

                        {ragResult && (
                            <div className="flex flex-col gap-3">
                                {/* Answer */}
                                <div className="rounded-xl p-4"
                                     style={{ background: "var(--arbo-surface-2)", border: "1px solid var(--arbo-border)" }}>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                                       style={{ color: "var(--arbo-accent)" }}>Análisis</p>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap"
                                       style={{ color: "var(--arbo-text-secondary)" }}>
                                        {ragResult.answer}
                                    </p>
                                </div>

                                {/* Sources */}
                                {ragResult.sources?.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider"
                                           style={{ color: "var(--arbo-text-muted)" }}>
                                            Fragmentos relevantes ({ragResult.sources.length})
                                        </p>
                                        {ragResult.sources.map((s, i) => (
                                            <div key={i} className="text-xs px-3 py-2 rounded-lg"
                                                 style={{ background: "var(--arbo-surface-2)", border: "1px solid var(--arbo-border)" }}>
                                                <span className="font-mono mr-2"
                                                      style={{ color: "var(--arbo-accent)" }}>
                                                    [{Math.round(s.score * 100)}%]
                                                </span>
                                                <span style={{ color: "var(--arbo-text-secondary)" }}>{s.textSnippet}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: "var(--arbo-border)" }} />
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--arbo-text-muted)" }}>
                    Análisis clásico (sin RAG)
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--arbo-border)" }} />
            </div>

            {/* ═══ Classic Analysis ═════════════════════════════════════════════ */}
            <div className="rounded-xl p-4 flex flex-col gap-3"
                 style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}>
                <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                    Análisis directo con IA sobre las respuestas del formulario seleccionado (sin búsqueda vectorial).
                </p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Pregunta específica (opcional). Ej: ¿Cuál es el problema más frecuente mencionado?"
                    rows={2}
                    className="arbo-input w-full resize-none text-sm"
                />
                <button
                    onClick={handleClassicAnalyze}
                    disabled={classicLoading || !selectedFormId}
                    className="arbo-btn arbo-btn-primary text-sm self-start gap-2 disabled:opacity-50"
                >
                    <Sparkles className="size-4" />
                    {classicLoading ? "Analizando..." : "Analizar respuestas"}
                </button>
            </div>

            {classicLoading && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                     style={{ background: "var(--arbo-surface-2)" }}>
                    <div className="arbo-spinner size-4" />
                    <p className="text-sm" style={{ color: "var(--arbo-text-muted)" }}>
                        Procesando respuestas con IA…
                    </p>
                </div>
            )}

            {classicError && (
                <p className="text-sm px-4 py-3 rounded-xl"
                   style={{ color: "var(--arbo-danger)", background: "rgba(239,68,68,0.08)" }}>
                    {classicError}
                </p>
            )}

            {classicResult && renderClassicResult(classicResult)}
        </div>
    );
};
