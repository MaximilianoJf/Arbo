import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Person, Envelope, Calendar, Hashtag,
    TextAlignLeft, CircleCheck, SquareCheck, ListUl,
    ArrowDownToLine, Sparkles, ChevronDown, ChevronUp, TrashBin,
    Sliders, FileText,
} from "@gravity-ui/icons";
import { formApi, apiKeyApi, projectApi } from "@/services/api";
import { PdfDesignerModal } from "../components/pdf-designer/PdfDesignerModal";
import type { PdfDesign } from "../components/pdf-designer/types";
import { DashboardTab } from "../components/dashboard-designer/DashboardTab";
import type { DashboardDesign } from "../components/dashboard-designer/types";
import { PowerBiConnectPanel } from "../components/PowerBiConnectPanel";
import { ChainTab } from "../components/responses/ChainTab";
import { FieldAnswer, formatAnswer } from "../components/responses/answer-render";

interface FormResponse {
    id: number;
    answers: Record<string, any>;
    respondentName: string | null;
    respondentEmail: string | null;
    respondentId: number | null;
    createdAt: string;
}

interface FormField {
    name: string;
    label: string;
    type: string;
    componentType: string;
    options?: { label: string; value: string }[] | string[];
    placeholder?: string;
}

interface FormData {
    id: number;
    title: string;
    description?: string;
    fields: FormField[];
    styles?: any;
}

// ── Main View ─────────────────────────────────────────────────────────────────
export const ResponsesView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [responses, setResponses] = useState<FormResponse[]>([]);
    const [form, setForm] = useState<FormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisOpen, setAnalysisOpen] = useState(true);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [showPromptBox, setShowPromptBox] = useState(false);
    const [promptText, setPromptText] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [showPdfConfig, setShowPdfConfig] = useState(false);
    const [exportingPdfId, setExportingPdfId] = useState<number | null>(null);
    const [generatingDashboard, setGeneratingDashboard] = useState(false);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [generatingPbi, setGeneratingPbi] = useState(false);
    const [showDashboardPrompt, setShowDashboardPrompt] = useState(false);
    const [dashboardPromptText, setDashboardPromptText] = useState("");
    const [savedDashboard, setSavedDashboard] = useState<DashboardDesign | null>(null);
    const [activeTab, setActiveTab] = useState<"responses" | "dashboard" | "chain">("responses");
    const [hasChain, setHasChain] = useState(false);
    const [projectId, setProjectId] = useState<number | null>(null);
    const [showPbiPanel, setShowPbiPanel] = useState(false);
    const [apiKeys, setApiKeys] = useState<{ id: number; name: string; key: string }[]>([]);

    const handleExportResponsePdf = async (responseId: number) => {
        setExportingPdfId(responseId);
        try {
            await formApi.exportResponsePdf(Number(id), responseId);
        } catch (err: any) {
            alert(err.message || "Error al exportar el PDF");
        } finally {
            setExportingPdfId(null);
        }
    };

    const handlePdfLayoutSaved = (design: PdfDesign) => {
        setForm((prev) => (prev ? { ...prev, styles: { ...(prev.styles || {}), pdfLayout: design } } : prev));
    };

    const handlePreviewDesign = async (design: PdfDesign) => {
        if (!selectedResponse) return;
        try {
            await formApi.previewResponsePdf(Number(id), selectedResponse.id, design);
        } catch (err: any) {
            alert(err.message || "Error al previsualizar el PDF");
        }
    };

    const handleDeleteResponse = async (responseId: number) => {
        setDeletingId(responseId);
        try {
            await formApi.deleteResponse(Number(id), responseId);
            const updated = responses.filter((r) => r.id !== responseId);
            setResponses(updated);
            if (selectedResponse?.id === responseId) {
                setSelectedResponse(updated.length > 0 ? updated[0] : null);
            }
        } catch (err: any) {
            alert(err.message || "Error al eliminar la respuesta");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleGenerateDashboard = async (prompt?: string) => {
        setGeneratingDashboard(true);
        setShowDashboardPrompt(false);
        setDashboardError(null);
        try {
            await formApi.generateDashboard(Number(id), prompt || undefined, savedDashboard || undefined);
        } catch (err: any) {
            setDashboardError(err.message || "Error al generar el dashboard");
        } finally {
            setGeneratingDashboard(false);
        }
    };

    const handleGeneratePbi = async () => {
        setGeneratingPbi(true);
        setDashboardError(null);
        try {
            await formApi.generatePowerBi(Number(id));
        } catch (err: any) {
            setDashboardError(err.message || "Error al generar el proyecto de Power BI");
        } finally {
            setGeneratingPbi(false);
        }
    };

    const handleAnalyze = async (prompt?: string) => {
        setAnalyzing(true);
        setAnalysisError(null);
        setShowPromptBox(false);
        try {
            const res = await formApi.analyzeResponses(Number(id), prompt || undefined);
            setAnalysis(res.data);
            setAnalysisOpen(true);
        } catch (err: any) {
            setAnalysisError(err.message || "Error al analizar");
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [formRes, responsesRes, keysRes] = await Promise.all([
                    formApi.getById(Number(id)),
                    formApi.getResponses(Number(id)),
                    apiKeyApi.list().catch(() => ({ ok: true, data: [] })),
                ]);
                setForm(formRes.data);
                setResponses(responsesRes.data);
                setApiKeys((keysRes as any).data || []);
                const savedLayout = formRes.data?.styles?.dashboardLayout;
                if (savedLayout) setSavedDashboard(savedLayout);
                if (responsesRes.data.length > 0) setSelectedResponse(responsesRes.data[0]);

                // Show the nested-forms tab only when this form participates in a relation
                const pid = formRes.data?.projectId ?? formRes.data?.Project?.id ?? formRes.data?.project?.id ?? null;
                setProjectId(pid);
                if (pid) {
                    try {
                        const rel = await projectApi.getRelations(pid);
                        const fid = Number(id);
                        setHasChain((rel.data || []).some((r: any) => r.parentFormId === fid || r.childFormId === fid));
                    } catch { /* relations are optional */ }
                }
            } catch (err: any) {
                setError(err.message || "Error al cargar respuestas");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center py-20"><div className="arbo-spinner" /></div>;

    if (error) return (
        <div className="flex flex-col items-center gap-4 py-20">
            <p className="text-[var(--arbo-danger)] font-medium">{error}</p>
            <button onClick={() => navigate("/form-builder")} className="arbo-btn arbo-btn-secondary">{t("responses.back")}</button>
        </div>
    );

    const fieldMap: Record<string, FormField> = {};
    form?.fields?.forEach((f) => { fieldMap[f.name] = f; });
    const orderedFieldNames = (form?.fields || [])
        .filter((f) => !f.name.startsWith("__page_break_"))
        .map((f) => f.name);

    const getOrderedAnswers = (response: FormResponse) => {
        const entries: { key: string; field: FormField | undefined; value: any }[] = [];
        for (const name of orderedFieldNames) {
            entries.push({ key: name, field: fieldMap[name], value: response.answers[name] });
        }
        for (const key of Object.keys(response.answers)) {
            if (!fieldMap[key] && !key.startsWith("__")) {
                entries.push({ key, field: undefined, value: response.answers[key] });
            }
        }
        return entries;
    };

    const selectedIndex = selectedResponse ? responses.findIndex((r) => r.id === selectedResponse.id) + 1 : 0;

    return (
        <div className="flex flex-col gap-5 max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate("/form-builder")} className="p-2 rounded-lg hover:bg-[var(--arbo-surface-2)] arbo-text-secondary transition-colors">
                    <ArrowLeft className="size-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold arbo-text">{form?.title}</h1>
                    <p className="text-sm arbo-text-muted">{t("responses.responses", { count: responses.length })}</p>
                </div>
                {responses.length > 0 && activeTab === "responses" && (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button
                            onClick={() => setShowPromptBox((v) => !v)}
                            disabled={analyzing}
                            className="arbo-btn arbo-btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                        >
                            <Sparkles className="size-3.5" /> {analyzing ? t("responses.analyzing") : t("responses.aiAnalysis")}
                        </button>
                        <button
                            onClick={() => setShowPdfConfig(true)}
                            className="arbo-btn arbo-btn-secondary text-xs py-1.5 px-3"
                            title="Diseñar visualmente el PDF de una respuesta"
                        >
                            <Sliders className="size-3.5" /> Diseñar PDF
                        </button>
                        <button
                            onClick={() => setShowPbiPanel((v) => !v)}
                            className="arbo-btn arbo-btn-secondary text-xs py-1.5 px-3"
                            title="Conectar Power BI Desktop a esta API"
                        >
                            Power BI
                        </button>
                        <button
                            onClick={() => setShowDashboardPrompt((v) => !v)}
                            disabled={generatingDashboard}
                            className="arbo-btn arbo-btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                            title="La IA genera un dashboard HTML interactivo según lo que necesitás"
                        >
                            <Sparkles className="size-3.5" />
                            {generatingDashboard ? "Generando…" : "Dashboard IA"}
                        </button>
                        <button
                            onClick={() => formApi.exportExcel(Number(id))}
                            className="arbo-btn arbo-btn-secondary text-xs py-1.5 px-3"
                        >
                            <ArrowDownToLine className="size-3.5" /> Excel
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            {responses.length > 0 && (
                <div className="flex items-center gap-1 border-b border-[var(--arbo-border)]">
                    {([
                        { id: "responses", label: t("responses.title") || "Respuestas" },
                        ...(hasChain ? [{ id: "chain", label: "Formularios anidados" } as const] : []),
                        { id: "dashboard", label: "Dashboard" },
                    ] as const).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                activeTab === tab.id
                                    ? "border-[var(--arbo-accent)] arbo-text"
                                    : "border-transparent arbo-text-muted hover:arbo-text"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Dashboard tab ── */}
            {activeTab === "dashboard" && responses.length > 0 && form && (
                <DashboardTab
                    formId={Number(id)}
                    formTitle={form.title}
                    fields={(form.fields || []).filter((f) => !f.name.startsWith("__page_break_")) as any}
                    responses={responses as any}
                    initial={savedDashboard}
                    defaultAccent={form.styles?.accentColor || "#4ADE80"}
                    onSaved={(d) => setSavedDashboard(d)}
                />
            )}

            {/* ── Nested forms tab ── */}
            {activeTab === "chain" && form && (
                <ChainTab formId={Number(id)} projectId={projectId} t={t} />
            )}

            {/* ════ Responses tab ════ */}
            {activeTab === "responses" && (<>

            {/* Power BI connection panel */}
            {showPbiPanel && (
                <PowerBiConnectPanel formId={id!} apiKeys={apiKeys} onClose={() => setShowPbiPanel(false)} />
            )}

            {/* Dashboard IA prompt box */}
            {showDashboardPrompt && (
                <div className="arbo-panel p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold arbo-text">¿Qué querés ver en el dashboard?</p>
                        <button onClick={() => setShowDashboardPrompt(false)} className="text-xs arbo-text-muted hover:arbo-text">✕</button>
                    </div>
                    <p className="text-xs arbo-text-muted -mt-1">
                        Describí lo que necesitás. Si lo dejás vacío, la IA decide qué mostrar según los datos.
                        {savedDashboard ? " Se basará en el dashboard que diseñaste." : ""}
                    </p>
                    <textarea
                        value={dashboardPromptText}
                        onChange={(e) => setDashboardPromptText(e.target.value)}
                        placeholder="Ej: quiero ver un gráfico de torta por edad, un ranking de las respuestas más frecuentes y destacar el NPS"
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted focus:outline-none focus:border-[var(--arbo-accent)] resize-none"
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleGenerateDashboard(dashboardPromptText || undefined); }}
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleGenerateDashboard(dashboardPromptText || undefined)}
                            disabled={generatingDashboard}
                            className="arbo-btn arbo-btn-primary text-sm disabled:opacity-50"
                        >
                            <Sparkles className="size-4" /> {generatingDashboard ? "Generando…" : "Generar dashboard"}
                        </button>
                        <button
                            onClick={() => handleGenerateDashboard()}
                            disabled={generatingDashboard}
                            className="arbo-btn arbo-btn-ghost text-sm disabled:opacity-50"
                        >
                            Sin descripción
                        </button>
                        <span className="text-xs arbo-text-muted ml-auto">Ctrl+Enter para generar</span>
                    </div>
                </div>
            )}

            {/* Prompt input box */}
            {showPromptBox && (
                <div className="arbo-panel p-4 flex flex-col gap-3">
                    <p className="text-sm font-semibold arbo-text">Consulta para el análisis</p>
                    <p className="text-xs arbo-text-muted -mt-1">
                        Dejalo vacío para un análisis general, o escribí una pregunta específica.
                    </p>
                    <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Ej: ¿Cuál es el campo con menor tasa de respuesta? ¿Qué patrón se repite más?"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted focus:outline-none focus:border-[var(--arbo-accent)] resize-none"
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAnalyze(promptText || undefined); }}
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleAnalyze(promptText || undefined)}
                            disabled={analyzing}
                            className="arbo-btn arbo-btn-primary text-sm disabled:opacity-50"
                        >
                            <Sparkles className="size-4" /> {analyzing ? t("responses.analyzing") : "Analizar"}
                        </button>
                        <button
                            onClick={() => { setShowPromptBox(false); setPromptText(""); }}
                            className="arbo-btn arbo-btn-ghost text-sm"
                        >
                            Cancelar
                        </button>
                        <span className="text-xs arbo-text-muted ml-auto">Ctrl+Enter para enviar</span>
                    </div>
                </div>
            )}

            {/* AI Analysis panel */}
            {analysisError && (
                <div className="p-3 rounded-lg bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/20">
                    <p className="text-sm text-[var(--arbo-danger)]">{analysisError}</p>
                </div>
            )}
            {dashboardError && (
                <div className="p-3 rounded-lg bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/20 flex items-center justify-between">
                    <p className="text-sm text-[var(--arbo-danger)]">{dashboardError}</p>
                    <button onClick={() => setDashboardError(null)} className="text-[var(--arbo-danger)] opacity-60 hover:opacity-100 ml-3 text-xs">✕</button>
                </div>
            )}
            {analysis && (
                <div className="arbo-panel overflow-hidden">
                    <button
                        onClick={() => setAnalysisOpen(!analysisOpen)}
                        className="w-full arbo-panel-header flex items-center justify-between cursor-pointer hover:bg-[var(--arbo-surface-2)] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-[var(--arbo-accent)]" />
                            <span>{t("responses.aiAnalysis")}</span>
                        </div>
                        {analysisOpen ? <ChevronUp className="size-4 arbo-text-muted" /> : <ChevronDown className="size-4 arbo-text-muted" />}
                    </button>
                    {analysisOpen && (
                        <div className="p-5 flex flex-col gap-5">
                            {/* Summary */}
                            <div>
                                <p className="text-sm arbo-text leading-relaxed">{analysis.summary}</p>
                            </div>

                            {/* Stats */}
                            {analysis.responseRate && (
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: t("responses.total"), value: analysis.responseRate.total, color: "var(--arbo-accent)" },
                                        { label: t("responses.complete"), value: analysis.responseRate.complete, color: "var(--arbo-info)" },
                                        { label: t("responses.incomplete"), value: analysis.responseRate.incomplete, color: "var(--arbo-warning)" },
                                    ].map((s) => (
                                        <div key={s.label} className="p-3 rounded-lg bg-[var(--arbo-surface-2)] text-center">
                                            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                            <p className="text-[11px] arbo-text-muted mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Sentiment */}
                            {analysis.sentiment && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium arbo-text-muted">{t("responses.sentiment")}</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                        analysis.sentiment.includes("positiv") ? "bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)]" :
                                        analysis.sentiment.includes("negativ") ? "bg-[var(--arbo-danger-muted)] text-[var(--arbo-danger)]" :
                                        "bg-[var(--arbo-surface-2)] arbo-text-secondary"
                                    }`}>
                                        {analysis.sentiment}
                                    </span>
                                </div>
                            )}

                            {/* Insights */}
                            {analysis.insights?.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-bold arbo-text-muted uppercase tracking-wider mb-2">{t("responses.insights")}</p>
                                    <ul className="flex flex-col gap-1.5">
                                        {analysis.insights.map((ins: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm arbo-text-secondary">
                                                <span className="text-[var(--arbo-accent)] mt-0.5 shrink-0">●</span>
                                                {ins}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Patterns */}
                            {analysis.patterns?.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-bold arbo-text-muted uppercase tracking-wider mb-2">{t("responses.patterns")}</p>
                                    <ul className="flex flex-col gap-1.5">
                                        {analysis.patterns.map((p: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm arbo-text-secondary">
                                                <span className="text-[var(--arbo-info)] mt-0.5 shrink-0">◆</span>
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggestions */}
                            {analysis.suggestions?.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-bold arbo-text-muted uppercase tracking-wider mb-2">{t("responses.suggestions")}</p>
                                    <ul className="flex flex-col gap-1.5">
                                        {analysis.suggestions.map((s: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-sm arbo-text-secondary">
                                                <span className="text-[var(--arbo-warning)] mt-0.5 shrink-0">▸</span>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {responses.length === 0 ? (
                <div className="arbo-card-static flex flex-col items-center gap-4 p-16 text-center">
                    <div className="size-16 rounded-2xl bg-[var(--arbo-surface-2)] flex items-center justify-center">
                        <Hashtag className="size-8 arbo-text-muted" />
                    </div>
                    <p className="text-lg font-semibold arbo-text">{t("responses.noResponses")}</p>
                    <p className="text-sm arbo-text-muted">{t("responses.noResponsesSubtitle")}</p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* ── Response list ── */}
                    <div className="arbo-panel w-full lg:w-72 shrink-0 overflow-hidden">
                        <div className="arbo-panel-header flex items-center justify-between">
                            <span>{t("responses.title")}</span>
                            <span className="arbo-badge arbo-badge-success">{responses.length}</span>
                        </div>
                        <div className="flex flex-col max-h-[600px] overflow-y-auto">
                            {responses.map((r, idx) => (
                                <div
                                    key={r.id}
                                    className={`group relative flex items-center gap-3 px-4 py-3.5 transition-all border-b border-[var(--arbo-border)] last:border-b-0 ${
                                        selectedResponse?.id === r.id
                                            ? "bg-[var(--arbo-accent-subtle)] border-l-[3px] border-l-[var(--arbo-accent)]"
                                            : "hover:bg-[var(--arbo-surface-2)]"
                                    }`}
                                >
                                    {/* Clickable area */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedResponse(r)}
                                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                    >
                                        <div className={`flex items-center justify-center size-9 rounded-full shrink-0 text-xs font-bold ${
                                            selectedResponse?.id === r.id
                                                ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]"
                                                : "bg-[var(--arbo-surface-3)] arbo-text-secondary"
                                        }`}>{idx + 1}</div>
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-sm font-medium arbo-text truncate">{r.respondentName || t("responses.anonymous")}</span>
                                            <span className="text-xs arbo-text-muted truncate">{r.respondentEmail || t("responses.noEmail")}</span>
                                            <span className="text-[11px] arbo-text-muted">
                                                {new Date(r.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}{" "}
                                                {new Date(r.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Delete button — visible on hover or confirm */}
                                    {confirmDeleteId === r.id ? (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => handleDeleteResponse(r.id)}
                                                disabled={deletingId === r.id}
                                                className="text-[10px] px-2 py-1 rounded bg-[var(--arbo-danger)] text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                                            >
                                                {deletingId === r.id ? "..." : "Sí"}
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-[10px] px-2 py-1 rounded bg-[var(--arbo-surface-3)] arbo-text-muted hover:arbo-text transition-colors"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
                                            className="shrink-0 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[var(--arbo-text-muted)] hover:text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)]"
                                            title="Eliminar respuesta"
                                        >
                                            <TrashBin className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Detail ── */}
                    {selectedResponse && (
                        <div className="flex-1 flex flex-col gap-4 min-w-0">
                            {/* Respondent meta */}
                            <div className="arbo-panel p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[11px] font-bold arbo-text-muted uppercase tracking-wider">
                                        {t("responses.responseNumber", { index: selectedIndex })}
                                    </p>
                                    {confirmDeleteId === selectedResponse.id ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs arbo-text-muted">¿Eliminar esta respuesta?</span>
                                            <button
                                                onClick={() => handleDeleteResponse(selectedResponse.id)}
                                                disabled={deletingId === selectedResponse.id}
                                                className="text-xs px-3 py-1 rounded-lg bg-[var(--arbo-danger)] text-white font-semibold hover:opacity-90 disabled:opacity-50"
                                            >
                                                {deletingId === selectedResponse.id ? "Eliminando..." : "Confirmar"}
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-xs px-3 py-1 rounded-lg bg-[var(--arbo-surface-2)] arbo-text-muted hover:arbo-text border border-[var(--arbo-border)]"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleExportResponsePdf(selectedResponse.id)}
                                                disabled={exportingPdfId === selectedResponse.id}
                                                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-[var(--arbo-accent)] hover:bg-[var(--arbo-accent-muted)] border border-[var(--arbo-accent)]/20 transition-colors disabled:opacity-50"
                                                title="Exportar esta respuesta como PDF"
                                            >
                                                <FileText className="size-3.5" />
                                                {exportingPdfId === selectedResponse.id ? "Generando..." : "Exportar PDF"}
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(selectedResponse.id)}
                                                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/20 transition-colors"
                                            >
                                                <TrashBin className="size-3.5" />
                                                Eliminar respuesta
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { icon: <Person className="size-4 text-[var(--arbo-accent)]" />, bg: "bg-[var(--arbo-accent-muted)]", label: t("responses.name"), value: selectedResponse.respondentName || t("responses.anonymous") },
                                        { icon: <Envelope className="size-4 text-[var(--arbo-info)]" />, bg: "bg-[rgba(59,130,246,0.15)]", label: t("responses.email"), value: selectedResponse.respondentEmail || t("responses.noEmail") },
                                        { icon: <Calendar className="size-4 text-[var(--arbo-warning)]" />, bg: "bg-[rgba(245,158,11,0.15)]", label: t("responses.sent"), value: `${new Date(selectedResponse.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}, ${new Date(selectedResponse.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` },
                                    ].map(({ icon, bg, label, value }) => (
                                        <div key={label} className="flex items-center gap-3">
                                            <div className={`flex items-center justify-center size-10 rounded-xl shrink-0 ${bg}`}>{icon}</div>
                                            <div>
                                                <p className="text-[11px] arbo-text-muted">{label}</p>
                                                <p className="text-sm font-medium arbo-text">{value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Form-style answers */}
                            <div className="arbo-panel overflow-hidden">
                                <div className="arbo-panel-header">{t("responses.formResponses")}</div>
                                <div className="p-5">
                                    {getOrderedAnswers(selectedResponse).length === 0 ? (
                                        <p className="text-sm arbo-text-muted text-center py-6">{t("responses.noRecordedResponses")}</p>
                                    ) : (
                                        <div className="flex flex-col gap-5">
                                            {getOrderedAnswers(selectedResponse).map(({ key, field, value }) =>
                                                field ? (
                                                    <FieldAnswer key={key} field={field} value={value} t={t} />
                                                ) : (
                                                    // Unknown field (not in form definition anymore)
                                                    <div key={key}>
                                                        <label className="text-xs font-medium arbo-text-secondary block mb-1.5">{key}</label>
                                                        <div className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-sm arbo-text">
                                                            {formatAnswer(value, t) || <span className="italic arbo-text-muted">{t("common.noResponse")}</span>}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            </>)}
            {/* ════ end Responses tab ════ */}

            {/* PDF visual designer modal */}
            {showPdfConfig && form && (
                <PdfDesignerModal
                    formId={Number(id)}
                    formTitle={form.title}
                    fields={(form.fields || []).filter((f) => !f.name.startsWith("__page_break_")) as any}
                    initial={form.styles?.pdfLayout ?? null}
                    defaultAccent={form.styles?.accentColor || "#4ADE80"}
                    onClose={() => setShowPdfConfig(false)}
                    onSaved={handlePdfLayoutSaved}
                    onPreview={selectedResponse ? handlePreviewDesign : undefined}
                />
            )}
        </div>
    );
};
