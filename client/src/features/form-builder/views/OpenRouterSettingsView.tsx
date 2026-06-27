import { useEffect, useState } from "react";
import { settingsApi } from "@/services/api";
import type { OpenRouterSettings, OpenRouterUsage } from "@/services/api";
import { Eye, EyeSlash, CircleCheck, TriangleExclamation, ArrowRotateRight, Database } from "@gravity-ui/icons";
import { AIProvidersPanel } from "../components/AIProvidersPanel";

type FreeModel = { id: string; name: string; contextLength: number; description: string; vision: boolean };

// Verified free vision models, shown even before loading the live list
const DEFAULT_VISION_OPTIONS: { id: string; name: string }[] = [
    { id: "google/gemma-4-31b-it:free", name: "Google: Gemma 4 31B" },
    { id: "google/gemma-4-26b-a4b-it:free", name: "Google: Gemma 4 26B A4B" },
    { id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", name: "NVIDIA: Nemotron 3 Nano Omni" },
];

function fmtCtx(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M ctx`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ctx`;
    return `${n} ctx`;
}

function UsageBar({ used, limit }: { used: number; limit: number | null }) {
    if (limit === null) {
        return (
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="arbo-text-muted">Uso acumulado</span>
                    <span className="arbo-text font-mono font-medium">${used.toFixed(6)}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--arbo-surface-2)] overflow-hidden">
                    <div
                        className="h-full rounded-full bg-[var(--arbo-accent)] transition-all duration-500"
                        style={{ width: used === 0 ? "2px" : "100%" }}
                    />
                </div>
                <p className="text-[11px] arbo-text-muted">Sin límite de crédito (free tier)</p>
            </div>
        );
    }

    const pct = Math.min((used / limit) * 100, 100);
    const color = pct > 80 ? "var(--arbo-danger)" : pct > 50 ? "#f59e0b" : "var(--arbo-accent)";

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="arbo-text-muted">Crédito usado</span>
                <span className="arbo-text font-mono font-medium">
                    ${used.toFixed(4)} / ${limit.toFixed(2)}
                </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--arbo-surface-2)] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <p className="text-[11px] arbo-text-muted">{(100 - pct).toFixed(1)}% restante</p>
        </div>
    );
}

export const OpenRouterSettingsView = () => {
    const [settings, setSettings] = useState<OpenRouterSettings | null>(null);
    const [usage, setUsage] = useState<OpenRouterUsage | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [loadingUsage, setLoadingUsage] = useState(false);
    const [usageError, setUsageError] = useState<string | null>(null);

    const [newApiKey, setNewApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState("");
    const [selectedVisionModel, setSelectedVisionModel] = useState("");
    const [saving, setSaving] = useState(false);

    // Embedding settings
    const [embApiKey, setEmbApiKey] = useState("");
    const [embModel, setEmbModel] = useState("text-embedding-004");
    const [embInfo, setEmbInfo] = useState<{ hasApiKey: boolean; apiKeyMasked: string | null; model: string; usingEnvKey: boolean } | null>(null);
    const [embSaving, setEmbSaving] = useState(false);
    const [embMsg, setEmbMsg] = useState<string | null>(null);

    // Qdrant settings
    const [qdrantUrl, setQdrantUrl] = useState("");
    const [qdrantApiKey, setQdrantApiKey] = useState("");
    const [qdrantInfo, setQdrantInfo] = useState<{ url: string; hasApiKey: boolean; apiKeyMasked: string | null; usingEnvConfig: boolean } | null>(null);
    const [qdrantSaving, setQdrantSaving] = useState(false);
    const [qdrantMsg, setQdrantMsg] = useState<string | null>(null);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [freeModels, setFreeModels] = useState<FreeModel[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsError, setModelsError] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await settingsApi.getOpenRouter();
            setSettings(res.data);
            setSelectedModel(res.data.model);
            setSelectedVisionModel(res.data.visionModel || DEFAULT_VISION_OPTIONS[0].id);
        } catch { /* ignore */ }
        finally { setLoadingSettings(false); }
    };

    const fetchUsage = async () => {
        setLoadingUsage(true);
        setUsageError(null);
        try {
            const res = await settingsApi.getOpenRouterUsage();
            setUsage(res.data);
        } catch (e: any) {
            setUsageError(e.message || "Error al obtener el uso");
        } finally {
            setLoadingUsage(false);
        }
    };

    const loadModels = async () => {
        setLoadingModels(true);
        setModelsError(null);
        try {
            const res = await settingsApi.getOpenRouterModels();
            setFreeModels(res.data);
        } catch (e: any) {
            setModelsError(e.message || "Error al cargar modelos");
        } finally {
            setLoadingModels(false);
        }
    };

    const loadEmbedding = async () => {
        try {
            const res = await settingsApi.getEmbedding();
            setEmbInfo(res.data);
            setEmbModel(res.data.model || "text-embedding-004");
        } catch { /* ignore */ }
    };

    const loadQdrant = async () => {
        try {
            const res = await settingsApi.getQdrant();
            setQdrantInfo(res.data);
            setQdrantUrl(res.data.url || "");
        } catch { /* ignore */ }
    };

    const handleSaveEmbedding = async () => {
        if (embSaving) return;
        setEmbSaving(true);
        setEmbMsg(null);
        try {
            await settingsApi.updateEmbedding({
                ...(embApiKey.trim() && { apiKey: embApiKey.trim() }),
                model: embModel,
            });
            setEmbMsg("Configuración de embeddings guardada");
            setEmbApiKey("");
            await loadEmbedding();
        } catch (e: any) {
            setEmbMsg(`Error: ${e.message}`);
        } finally {
            setEmbSaving(false);
        }
    };

    const handleSaveQdrant = async () => {
        if (qdrantSaving) return;
        setQdrantSaving(true);
        setQdrantMsg(null);
        try {
            await settingsApi.updateQdrant({
                url: qdrantUrl.trim() || undefined,
                ...(qdrantApiKey.trim() && { apiKey: qdrantApiKey.trim() }),
            });
            setQdrantMsg("Configuración de Qdrant guardada");
            setQdrantApiKey("");
            await loadQdrant();
        } catch (e: any) {
            setQdrantMsg(`Error: ${e.message}`);
        } finally {
            setQdrantSaving(false);
        }
    };

    useEffect(() => { load(); loadEmbedding(); loadQdrant(); }, []);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        setSaveMsg(null);
        try {
            await settingsApi.updateOpenRouter({
                ...(newApiKey.trim() && { apiKey: newApiKey.trim() }),
                model: selectedModel,
                visionModel: selectedVisionModel,
            });
            setSaveMsg("Configuración guardada");
            setNewApiKey("");
            setShowKey(false);
            load();
            setUsage(null);
        } catch (e: any) {
            setSaveMsg(e.message || "Error al guardar");
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 3000);
        }
    };

    if (loadingSettings) {
        return <div className="flex items-center justify-center py-20"><div className="arbo-spinner" /></div>;
    }

    const modelChanged = selectedModel !== settings?.model;
    const visionModelChanged = !!selectedVisionModel && selectedVisionModel !== settings?.visionModel;
    const canSave = newApiKey.trim() || modelChanged || visionModelChanged;

    // Vision options: live list if loaded, otherwise the verified defaults
    const liveVisionModels = freeModels.filter((m) => m.vision);
    const visionOptions = liveVisionModels.length > 0
        ? liveVisionModels.map((m) => ({ id: m.id, name: m.name }))
        : DEFAULT_VISION_OPTIONS;
    const visionOptionsFull = visionOptions.some((o) => o.id === selectedVisionModel)
        ? visionOptions
        : [...(selectedVisionModel ? [{ id: selectedVisionModel, name: selectedVisionModel }] : []), ...visionOptions];

    return (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
            <div>
                <h1 className="text-xl font-bold arbo-text">Configuración de IA</h1>
                <p className="text-sm arbo-text-muted mt-0.5">
                    Configurá las API keys gratuitas de los servicios de IA. Si uno agota su cuota, el siguiente toma el relevo automáticamente.
                </p>
            </div>

            {/* Multi-provider failover + consumption panel */}
            <div className="arbo-panel p-5">
                <AIProvidersPanel />
            </div>

            {/* API Key section */}
            <div className="arbo-panel p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold arbo-text">API Key de OpenRouter</h2>
                    {settings?.hasApiKey ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)] px-2 py-0.5 rounded-full">
                            <CircleCheck className="size-3" /> Configurada
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)] px-2 py-0.5 rounded-full">
                            <TriangleExclamation className="size-3" /> Sin configurar
                        </span>
                    )}
                </div>

                {settings?.hasApiKey && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                        <code className="flex-1 text-xs arbo-text-muted font-mono">
                            {settings.apiKeyMasked}
                        </code>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium arbo-text-muted">
                        {settings?.hasApiKey ? "Reemplazar API key" : "Ingresar API key"}
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type={showKey ? "text" : "password"}
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted focus:outline-none focus:border-[var(--arbo-accent)] font-mono"
                        />
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="p-2 rounded-lg hover:bg-[var(--arbo-surface-2)] arbo-text-muted"
                            title={showKey ? "Ocultar" : "Mostrar"}
                        >
                            {showKey ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <p className="text-[11px] arbo-text-muted">
                        Obtené tu key gratis en{" "}
                        <span className="text-[var(--arbo-accent)] font-mono">openrouter.ai/keys</span>
                    </p>
                </div>
            </div>

            {/* Model selector */}
            <div className="arbo-panel p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold arbo-text">Modelo</h2>
                    <button
                        onClick={loadModels}
                        disabled={loadingModels || !settings?.hasApiKey}
                        className="flex items-center gap-1.5 text-xs arbo-text-muted hover:arbo-text transition-colors disabled:opacity-40"
                        title={settings?.hasApiKey ? "Cargar modelos disponibles desde OpenRouter" : "Necesitás configurar una API key primero"}
                    >
                        <ArrowRotateRight className={`size-3.5 ${loadingModels ? "animate-spin" : ""}`} />
                        {loadingModels ? "Cargando..." : "Cargar modelos reales"}
                    </button>
                </div>

                {modelsError && <p className="text-xs text-[var(--arbo-danger)]">{modelsError}</p>}

                {freeModels.length > 0 ? (
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-semibold arbo-text-muted uppercase tracking-wider mb-1">
                            Modelos gratuitos disponibles ({freeModels.length})
                        </p>
                        <div className="max-h-72 overflow-y-auto flex flex-col gap-0.5 pr-1">
                            {freeModels.map((m) => (
                                <label
                                    key={m.id}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                        selectedModel === m.id
                                            ? "bg-[var(--arbo-accent-muted)] border border-[var(--arbo-accent)]/40"
                                            : "hover:bg-[var(--arbo-surface-2)] border border-transparent"
                                    }`}
                                >
                                    <input type="radio" name="model" value={m.id} checked={selectedModel === m.id}
                                        onChange={() => setSelectedModel(m.id)} className="accent-[var(--arbo-accent)] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm arbo-text font-medium truncate">{m.name}</p>
                                        <p className="text-[11px] font-mono arbo-text-muted truncate">{m.id}</p>
                                    </div>
                                    <span className="text-[10px] font-semibold text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)] px-1.5 py-0.5 rounded shrink-0">
                                        {fmtCtx(m.contextLength)}
                                    </span>
                                    {m.vision && (
                                        <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded shrink-0" title="Acepta imágenes — disponible para el escaneo de formularios">VISIÓN</span>
                                    )}
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded shrink-0">FREE</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p className="text-xs arbo-text-muted">
                            Modelo actual: <code className="font-mono text-[var(--arbo-accent)]">{selectedModel || "—"}</code>
                        </p>
                        <p className="text-xs arbo-text-muted">
                            Hacé click en <strong className="arbo-text">Cargar modelos reales</strong> para ver todos los modelos gratuitos disponibles en OpenRouter en tiempo real.
                        </p>
                    </div>
                )}
            </div>

            {/* Vision model selector (photo scanning) */}
            <div className="arbo-panel p-5 flex flex-col gap-3">
                <div>
                    <h2 className="text-sm font-semibold arbo-text">Modelo de visión</h2>
                    <p className="text-[11px] arbo-text-muted mt-0.5">
                        Se usa automáticamente cuando la petición incluye una imagen (ej: escanear un formulario desde una foto).
                        Las peticiones de solo texto siguen usando el modelo de arriba.
                    </p>
                </div>
                <select
                    value={selectedVisionModel}
                    onChange={(e) => setSelectedVisionModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm focus:outline-none focus:border-[var(--arbo-accent)]"
                >
                    {visionOptionsFull.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} — {m.id}</option>
                    ))}
                </select>
                {liveVisionModels.length === 0 && (
                    <p className="text-[11px] arbo-text-muted">
                        Mostrando modelos de visión verificados. Con <strong className="arbo-text">Cargar modelos reales</strong> (arriba) la lista se completa con todos los gratuitos que aceptan imágenes.
                    </p>
                )}
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className="arbo-btn arbo-btn-primary disabled:opacity-50"
                >
                    {saving ? "Guardando..." : "Guardar configuración"}
                </button>
                {saveMsg && (
                    <span className={`text-sm font-medium ${
                        saveMsg.includes("Error") ? "text-[var(--arbo-danger)]" : "text-[var(--arbo-accent)]"
                    }`}>
                        {saveMsg}
                    </span>
                )}
            </div>

            {/* Usage panel */}
            <div className="arbo-panel overflow-hidden">
                <div className="arbo-panel-header flex items-center justify-between">
                    <span>Uso de la API</span>
                    {settings?.hasApiKey && (
                        <button
                            onClick={fetchUsage}
                            disabled={loadingUsage}
                            className="flex items-center gap-1.5 text-xs arbo-text-muted hover:arbo-text transition-colors disabled:opacity-50"
                        >
                            <ArrowRotateRight className={`size-3.5 ${loadingUsage ? "animate-spin" : ""}`} />
                            {loadingUsage ? "Consultando..." : "Actualizar"}
                        </button>
                    )}
                </div>

                <div className="p-5">
                    {!settings?.hasApiKey ? (
                        <p className="text-sm arbo-text-muted text-center py-4">
                            Configurá una API key para ver el uso
                        </p>
                    ) : usageError ? (
                        <p className="text-sm text-[var(--arbo-danger)]">{usageError}</p>
                    ) : !usage ? (
                        <p className="text-sm arbo-text-muted text-center py-4">
                            Hacé click en <strong className="arbo-text">Actualizar</strong> para ver el uso actual
                        </p>
                    ) : (
                        <div className="flex flex-col gap-5">
                            <UsageBar used={usage.usage} limit={usage.limit} />

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg bg-[var(--arbo-surface-2)] p-3">
                                    <p className="text-[11px] arbo-text-muted mb-1">Tipo de cuenta</p>
                                    <p className="text-sm font-semibold arbo-text">
                                        {usage.is_free_tier ? "Free Tier" : "Pago"}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--arbo-surface-2)] p-3">
                                    <p className="text-[11px] arbo-text-muted mb-1">Rate limit</p>
                                    <p className="text-sm font-semibold arbo-text font-mono">
                                        {usage.rate_limit?.requests ?? "—"} req / {usage.rate_limit?.interval ?? "—"}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--arbo-surface-2)] p-3">
                                    <p className="text-[11px] arbo-text-muted mb-1">Crédito usado</p>
                                    <p className="text-sm font-semibold arbo-text font-mono">
                                        ${usage.usage.toFixed(6)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--arbo-surface-2)] p-3">
                                    <p className="text-[11px] arbo-text-muted mb-1">Límite</p>
                                    <p className="text-sm font-semibold arbo-text font-mono">
                                        {usage.limit === null ? "Sin límite" : `$${usage.limit.toFixed(2)}`}
                                    </p>
                                </div>
                            </div>

                            {usage.label && (
                                <p className="text-xs arbo-text-muted">
                                    Key: <span className="font-mono">{usage.label}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Embeddings (Gemini) ══════════════════════════════════════ */}
            <div className="arbo-panel overflow-hidden">
                <div className="arbo-panel-header flex items-center gap-2">
                    <Database className="size-4" />
                    <span>Embeddings para RAG</span>
                </div>
                <div className="p-5 flex flex-col gap-4">
                    <p className="text-xs arbo-text-muted">
                        Usados para construir el índice RAG de análisis de respuestas. Se admite la API de embeddings de Gemini (<span className="font-mono">text-embedding-004</span>). Si no configurás una key aquí, el sistema usa la variable de entorno <span className="font-mono">GEMINI_EMBEDDING_API_KEY</span>.
                    </p>

                    {embInfo && (
                        <div className="flex items-center gap-2 text-xs arbo-text-muted">
                            {embInfo.hasApiKey
                                ? <><CircleCheck className="size-3.5 text-[var(--arbo-accent)]" /> {embInfo.usingEnvKey ? "Usando key del servidor (.env)" : embInfo.apiKeyMasked}</>
                                : <><TriangleExclamation className="size-3.5 text-[var(--arbo-danger)]" /> Sin API key configurada</>
                            }
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium arbo-text-muted">Gemini API Key</label>
                            <input
                                type="password"
                                value={embApiKey}
                                onChange={(e) => setEmbApiKey(e.target.value)}
                                placeholder={embInfo?.hasApiKey ? "Nueva key (dejar vacío para mantener)" : "AIza…"}
                                className="arbo-input text-sm font-mono"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium arbo-text-muted">Modelo de embeddings</label>
                            <select
                                value={embModel}
                                onChange={(e) => setEmbModel(e.target.value)}
                                className="arbo-input text-sm"
                            >
                                <option value="gemini-embedding-001">gemini-embedding-001 (recomendado, 768 dim)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSaveEmbedding}
                            disabled={embSaving}
                            className="arbo-btn arbo-btn-primary disabled:opacity-50"
                        >
                            {embSaving ? "Guardando…" : "Guardar configuración"}
                        </button>
                        {embMsg && (
                            <span className={`text-sm font-medium ${embMsg.startsWith("Error") ? "text-[var(--arbo-danger)]" : "text-[var(--arbo-accent)]"}`}>
                                {embMsg}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ Qdrant ══════════════════════════════════════════════════ */}
            <div className="arbo-panel overflow-hidden">
                <div className="arbo-panel-header flex items-center gap-2">
                    <Database className="size-4" />
                    <span>Qdrant (vector DB para RAG)</span>
                </div>
                <div className="p-5 flex flex-col gap-4">
                    <p className="text-xs arbo-text-muted">
                        Base de datos vectorial donde se almacenan los embeddings del RAG. Si no configurás los datos aquí, el sistema usa las variables de entorno <span className="font-mono">QDRANT_URL</span> y <span className="font-mono">QDRANT_API_KEY</span>.
                    </p>

                    {qdrantInfo && (
                        <div className="flex items-center gap-2 text-xs arbo-text-muted">
                            {qdrantInfo.url
                                ? <><CircleCheck className="size-3.5 text-[var(--arbo-accent)]" /> {qdrantInfo.usingEnvConfig ? "Usando configuración del servidor (.env)" : qdrantInfo.url}</>
                                : <><TriangleExclamation className="size-3.5 text-[var(--arbo-danger)]" /> Sin URL configurada</>
                            }
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium arbo-text-muted">URL de Qdrant</label>
                            <input
                                type="text"
                                value={qdrantUrl}
                                onChange={(e) => setQdrantUrl(e.target.value)}
                                placeholder="https://xyz.qdrant.io"
                                className="arbo-input text-sm font-mono"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium arbo-text-muted">API Key de Qdrant</label>
                            <input
                                type="password"
                                value={qdrantApiKey}
                                onChange={(e) => setQdrantApiKey(e.target.value)}
                                placeholder={qdrantInfo?.hasApiKey ? "Nueva key (dejar vacío para mantener)" : "qdrant-key…"}
                                className="arbo-input text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSaveQdrant}
                            disabled={qdrantSaving}
                            className="arbo-btn arbo-btn-primary disabled:opacity-50"
                        >
                            {qdrantSaving ? "Guardando…" : "Guardar configuración"}
                        </button>
                        {qdrantMsg && (
                            <span className={`text-sm font-medium ${qdrantMsg.startsWith("Error") ? "text-[var(--arbo-danger)]" : "text-[var(--arbo-accent)]"}`}>
                                {qdrantMsg}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
