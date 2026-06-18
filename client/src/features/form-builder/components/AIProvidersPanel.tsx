import { useEffect, useState } from "react";
import { settingsApi } from "@/services/api";
import type { AIProviderInfo, AIProvidersData } from "@/services/api";
import { ArrowRotateRight, ArrowUp, ArrowDown, CircleCheck, TriangleExclamation, Eye, EyeSlash } from "@gravity-ui/icons";

/**
 * Multi-provider AI panel: one card per free AI service with its API key,
 * on/off switch, daily consumption bar and failover order. When a provider
 * runs out of quota the server automatically falls over to the next one.
 */
export const AIProvidersPanel = () => {
    const [data, setData] = useState<AIProvidersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<string | null>(null);

    const load = async () => {
        try {
            const res = await settingsApi.getAIProviders();
            setData(res.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const flash = (text: string) => {
        setMsg(text);
        setTimeout(() => setMsg(null), 2500);
    };

    const move = async (idx: number, dir: -1 | 1) => {
        if (!data) return;
        const order = data.providers.map((p) => p.id);
        const target = idx + dir;
        if (target < 0 || target >= order.length) return;
        [order[idx], order[target]] = [order[target], order[idx]];
        await settingsApi.updateAIProviderOrder(order);
        await load();
    };

    const update = async (id: string, body: { apiKey?: string; model?: string; enabled?: boolean }) => {
        await settingsApi.updateAIProvider(id, body);
        await load();
        flash("Guardado");
    };

    if (loading) {
        return <div className="flex justify-center py-8"><div className="arbo-spinner" /></div>;
    }
    if (!data) return null;

    const configured = data.providers.filter((p) => p.hasApiKey && p.enabled);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold arbo-text">Proveedores de IA (failover automático)</h2>
                    <p className="text-[11px] arbo-text-muted mt-0.5">
                        Configurá una o más API keys gratuitas. Cuando un servicio agota su cuota,
                        el siguiente de la lista toma el relevo automáticamente.
                    </p>
                </div>
                <button onClick={load} className="arbo-btn arbo-btn-ghost text-xs px-2 py-1.5 shrink-0" title="Actualizar consumo">
                    <ArrowRotateRight className="size-3.5" />
                </button>
            </div>

            {configured.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--arbo-danger)]/40 bg-[var(--arbo-danger-muted)]">
                    <TriangleExclamation className="size-4 text-[var(--arbo-danger)] shrink-0" />
                    <p className="text-xs arbo-text">No hay ningún proveedor activo con API key — el asistente de IA no va a funcionar.</p>
                </div>
            )}
            {msg && <p className="text-xs text-green-400">{msg}</p>}

            <div className="flex flex-col gap-2.5">
                {data.providers.map((p, idx) => (
                    <ProviderCard
                        key={p.id}
                        provider={p}
                        position={idx + 1}
                        isFirst={idx === 0}
                        isLast={idx === data.providers.length - 1}
                        onMove={(dir) => move(idx, dir)}
                        onUpdate={(body) => update(p.id, body)}
                    />
                ))}
            </div>

            <p className="text-[10px] arbo-text-muted">
                El consumo diario se trackea localmente y se reinicia a medianoche UTC.
            </p>
        </div>
    );
};

// --- One provider card: switch + key + model + consumption ---
const ProviderCard = ({ provider: p, position, isFirst, isLast, onMove, onUpdate }: {
    provider: AIProviderInfo;
    position: number;
    isFirst: boolean;
    isLast: boolean;
    onMove: (dir: -1 | 1) => void;
    onUpdate: (body: { apiKey?: string; model?: string; enabled?: boolean }) => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const [keyInput, setKeyInput] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [modelInput, setModelInput] = useState(p.model);

    const pct = p.dailyLimit > 0 ? Math.min((p.usage.used / p.dailyLimit) * 100, 100) : 0;
    const barColor = p.usage.exhausted || pct >= 100 ? "var(--arbo-danger)" : pct > 70 ? "#f59e0b" : "var(--arbo-accent)";

    const status = !p.hasApiKey
        ? { label: "Sin API key", cls: "arbo-text-muted bg-[var(--arbo-surface-2)] border-[var(--arbo-border)]" }
        : !p.enabled
        ? { label: "Desactivado", cls: "arbo-text-muted bg-[var(--arbo-surface-2)] border-[var(--arbo-border)]" }
        : p.usage.exhausted
        ? { label: "Agotado", cls: "text-[var(--arbo-danger)] bg-[var(--arbo-danger-muted)] border-[var(--arbo-danger)]/40" }
        : { label: "Activo", cls: "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)] border-[var(--arbo-accent)]/40" };

    return (
        <div className="rounded-xl border border-[var(--arbo-border)] bg-[var(--arbo-surface)] overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-2.5 px-3 py-2.5">
                {/* Priority + reorder */}
                <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono arbo-text-muted w-4 text-center">{position}</span>
                    <div className="flex flex-col">
                        <button onClick={() => onMove(-1)} disabled={isFirst}
                            className="arbo-text-muted hover:text-[var(--arbo-accent)] disabled:opacity-20 leading-none" title="Subir prioridad">
                            <ArrowUp className="size-3" />
                        </button>
                        <button onClick={() => onMove(1)} disabled={isLast}
                            className="arbo-text-muted hover:text-[var(--arbo-accent)] disabled:opacity-20 leading-none" title="Bajar prioridad">
                            <ArrowDown className="size-3" />
                        </button>
                    </div>
                </div>

                <button onClick={() => setExpanded((v) => !v)} className="flex-1 flex items-center gap-2 text-left min-w-0 cursor-pointer">
                    <span className="text-sm font-semibold arbo-text">{p.label}</span>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                    {p.hasApiKey && <CircleCheck className="size-3.5 text-[var(--arbo-accent)] shrink-0" />}
                </button>

                {/* Enable switch */}
                <button
                    onClick={() => onUpdate({ enabled: !p.enabled })}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${p.enabled ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}
                    title={p.enabled ? "Desactivar proveedor" : "Activar proveedor"}
                >
                    <div className={`size-4 rounded-full bg-white transition-transform ${p.enabled ? "translate-x-4" : "translate-x-0"}`} />
                </button>
            </div>

            {/* Consumption bar — always visible when there's a key */}
            {p.hasApiKey && (
                <div className="px-3 pb-2.5 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="arbo-text-muted">Consumo hoy</span>
                        <span className="arbo-text font-mono">{p.usage.used} / {p.dailyLimit} req</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--arbo-surface-2)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, p.usage.used > 0 ? 2 : 0)}%`, backgroundColor: barColor }} />
                    </div>
                    {p.usage.exhausted && p.usage.exhaustedUntil && (
                        <p className="text-[10px] text-[var(--arbo-danger)]">
                            Sin cuota — se reintenta {new Date(p.usage.exhaustedUntil).toLocaleTimeString()} ({new Date(p.usage.exhaustedUntil).toLocaleDateString()})
                        </p>
                    )}
                    {p.usage.lastError && !p.usage.exhausted && (
                        <p className="text-[10px] text-[#f59e0b] truncate" title={p.usage.lastError}>Último error: {p.usage.lastError}</p>
                    )}
                    {p.usage.lastModel && (
                        <p className="text-[10px] arbo-text-muted truncate">Último modelo: {p.usage.lastModel}</p>
                    )}
                </div>
            )}

            {/* Expanded: key + model config */}
            {expanded && (
                <div className="px-3 pb-3 pt-1 border-t border-[var(--arbo-border)] flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] arbo-text-secondary">
                            API key {p.apiKeyMasked && <span className="font-mono arbo-text-muted">({p.apiKeyMasked})</span>}
                        </label>
                        <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                    placeholder={p.keyHint}
                                    className="w-full px-2 py-1.5 pr-8 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs outline-none focus:border-[var(--arbo-accent)] font-mono"
                                />
                                <button onClick={() => setShowKey((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 arbo-text-muted hover:arbo-text">
                                    {showKey ? <EyeSlash className="size-3.5" /> : <Eye className="size-3.5" />}
                                </button>
                            </div>
                            <button
                                onClick={() => { if (keyInput.trim()) { onUpdate({ apiKey: keyInput.trim() }); setKeyInput(""); } }}
                                disabled={!keyInput.trim()}
                                className="arbo-btn arbo-btn-primary text-xs px-3 py-1.5 disabled:opacity-40">
                                Guardar
                            </button>
                            {p.hasApiKey && (
                                <button onClick={() => onUpdate({ apiKey: "" })}
                                    className="arbo-btn arbo-btn-ghost text-xs px-2 py-1.5 text-[var(--arbo-danger)]" title="Quitar key">
                                    ×
                                </button>
                            )}
                        </div>
                        <a href={p.docsUrl} target="_blank" rel="noreferrer"
                            className="text-[10px] text-[var(--arbo-accent)] hover:underline w-fit">
                            Conseguir API key gratis →
                        </a>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] arbo-text-secondary">Modelo</label>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="text"
                                value={modelInput}
                                onChange={(e) => setModelInput(e.target.value)}
                                placeholder={p.defaultModel}
                                className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-xs outline-none focus:border-[var(--arbo-accent)] font-mono"
                            />
                            <button
                                onClick={() => onUpdate({ model: modelInput.trim() || p.defaultModel })}
                                className="arbo-btn arbo-btn-secondary text-xs px-3 py-1.5">
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
