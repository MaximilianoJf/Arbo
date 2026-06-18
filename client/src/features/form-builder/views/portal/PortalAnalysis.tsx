import { useState, useCallback } from "react";
import { formApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import { Sparkles, ChevronDown, ChevronUp } from "@gravity-ui/icons";

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

export const PortalAnalysis = () => {
    const { project } = usePortal();
    const forms: any[] = project?.forms || project?.userForms || project?.UserForms || [];
    const [selectedFormId, setSelectedFormId] = useState<number | null>(forms[0]?.id ?? null);
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = useCallback(async () => {
        if (!selectedFormId || loading) return;
        setLoading(true); setError(null); setResult(null);
        try {
            const res = await formApi.analyzeResponses(selectedFormId, prompt.trim() || undefined);
            setResult(res.data);
        } catch (e: any) {
            setError(e.message || "Error al analizar");
        } finally {
            setLoading(false);
        }
    }, [selectedFormId, prompt, loading]);

    const renderResult = (data: any) => {
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
                {/* Render any remaining keys */}
                {Object.entries(data)
                    .filter(([k]) => !["summary","insights","trends","recommendations","sentiment"].includes(k))
                    .map(([k, v]) => <Section key={k} title={k.charAt(0).toUpperCase() + k.slice(1)} content={v as any} />)
                }
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-5 max-w-3xl">
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--arbo-text-muted)" }}>
                    Análisis con IA
                </h2>
                <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                    La IA analiza todas las respuestas del formulario seleccionado y genera un informe con patrones, tendencias y recomendaciones.
                </p>
            </div>

            {/* Controls */}
            <div
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
            >
                <select
                    value={selectedFormId ?? ""}
                    onChange={(e) => { setSelectedFormId(Number(e.target.value)); setResult(null); }}
                    className="arbo-input text-sm w-full"
                >
                    {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Pregunta específica (opcional). Ej: ¿Cuál es el problema más frecuente mencionado?"
                    rows={2}
                    className="arbo-input w-full resize-none text-sm"
                />
                <button
                    onClick={handleAnalyze}
                    disabled={loading || !selectedFormId}
                    className="arbo-btn arbo-btn-primary text-sm self-start gap-2 disabled:opacity-50"
                >
                    <Sparkles className="size-4" />
                    {loading ? "Analizando..." : "Analizar respuestas"}
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--arbo-surface-2)" }}>
                    <div className="arbo-spinner size-4" />
                    <p className="text-sm" style={{ color: "var(--arbo-text-muted)" }}>
                        Procesando respuestas con IA...
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-sm text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)] px-4 py-3 rounded-xl">{error}</p>
            )}

            {/* Result */}
            {result && renderResult(result)}
        </div>
    );
};
