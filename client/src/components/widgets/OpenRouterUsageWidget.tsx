import { useState, useEffect, useCallback } from "react";
import { settingsApi } from "@/services/api";
import type { OpenRouterUsage } from "@/services/api";

const SparkIcon = () => (
    <svg className="size-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0l1.5 4.5L14 6l-4.5 1.5L8 12l-1.5-4.5L2 6l4.5-1.5L8 0z" />
    </svg>
);

const fmtUSD = (n: number) => {
    if (n === 0) return "$0.00";
    if (n < 0.01) return `${(n * 100).toFixed(4)}¢`;
    return `$${n.toFixed(4)}`;
};

const fmtReset = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const BarRow = ({
    label,
    used,
    total,
    color,
    valueLabel,
}: {
    label: string;
    used: number;
    total: number;
    color: string;
    valueLabel: string;
}) => {
    const pct = total > 0 ? Math.min(1, used / total) : 0;
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline">
                <span className="arbo-text-muted text-[10px]">{label}</span>
                <span className="font-semibold text-[10px] tabular-nums" style={{ color }}>
                    {valueLabel}
                </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-[var(--arbo-border)]">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct * 100}%`, background: color }}
                />
            </div>
        </div>
    );
};

export const OpenRouterUsageWidget = () => {
    const [data, setData] = useState<OpenRouterUsage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await settingsApi.getOpenRouterUsage();
            setData(res.data);
            setError(null);
        } catch (e: any) {
            setError(e.message || "Error");
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(load, 5 * 60 * 1000);
        return () => clearInterval(id);
    }, [load]);

    if (!data && !error) return null;

    // ── Daily requests ──────────────────────────────────────
    const dailyUsed = data?.daily?.used ?? 0;
    const dailyLimit = data?.daily?.limit ?? 50;
    const dailyRemaining = data?.daily?.remaining ?? dailyLimit;
    const dailyPct = dailyLimit > 0 ? dailyUsed / dailyLimit : 0;

    const dailyColor =
        dailyPct < 0.6 ? "#4ADE80" : dailyPct < 0.85 ? "#FACC15" : "#F87171";

    // ── Credit usage (from OpenRouter) ──────────────────────
    const creditUsed = data?.usage ?? 0;
    const creditLimit = data?.limit ?? null;
    const hasLimit = creditLimit != null && creditLimit > 0;
    const creditPct = hasLimit ? Math.min(1, creditUsed / creditLimit!) : 0;
    const creditColor = !hasLimit
        ? "#4ADE80"
        : creditPct < 0.5 ? "#4ADE80"
        : creditPct < 0.8 ? "#FACC15"
        : "#F87171";

    // ── Pill label: show daily used / limit (same convention as tooltip) ───
    const pillLabel = error
        ? "Sin clave"
        : `${dailyUsed}/${dailyLimit}`;

    return (
        <div className="fixed bottom-4 left-4 z-50 select-none">

            {/* ── Expanded tooltip ── */}
            {open && data && (
                <div
                    className="mb-2 rounded-xl border border-[var(--arbo-border)] p-3 flex flex-col gap-3 shadow-xl"
                    style={{
                        background: "var(--arbo-surface-2)",
                        width: "200px",
                        backdropFilter: "blur(14px)",
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <p className="font-semibold arbo-text text-xs">OpenRouter</p>
                        {data.is_free_tier && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold uppercase tracking-wider">
                                Free tier
                            </span>
                        )}
                    </div>

                    {/* Daily requests */}
                    <div className="flex flex-col gap-2">
                        <BarRow
                            label="Requests vía Arbo hoy"
                            used={dailyUsed}
                            total={dailyLimit}
                            color={dailyColor}
                            valueLabel={`${dailyUsed} / ${dailyLimit}`}
                        />
                        <p className="text-[9px]" style={{ color: dailyColor }}>
                            {dailyRemaining} restantes · reinicia a las {fmtReset(data.daily.resetAt)}
                        </p>
                        <p className="text-[9px] arbo-text-muted italic leading-tight">
                            Solo cuenta requests del chat IA de Arbo, no de otras apps.
                        </p>
                    </div>

                    <div className="border-t border-[var(--arbo-border)]" />

                    {/* Credit usage */}
                    <div className="flex flex-col gap-2">
                        {hasLimit ? (
                            <BarRow
                                label="Crédito usado"
                                used={creditUsed}
                                total={creditLimit!}
                                color={creditColor}
                                valueLabel={`${fmtUSD(creditUsed)} / ${fmtUSD(creditLimit!)}`}
                            />
                        ) : (
                            <div className="flex justify-between items-center">
                                <span className="arbo-text-muted text-[10px]">Crédito usado</span>
                                <span className="text-[10px] font-medium arbo-text tabular-nums">
                                    {fmtUSD(creditUsed)}
                                </span>
                            </div>
                        )}
                        {!hasLimit && (
                            <p className="text-[9px] text-emerald-400 italic">Sin límite de crédito</p>
                        )}
                    </div>

                    {/* Rate limit */}
                    <div className="flex justify-between arbo-text-muted text-[10px] border-t border-[var(--arbo-border)] pt-2">
                        <span>Rate limit</span>
                        <span className="arbo-text">
                            {data.rate_limit.requests === -1 ? "∞" : data.rate_limit.requests}
                            {" "}req/{data.rate_limit.interval}
                        </span>
                    </div>
                </div>
            )}

            {/* ── Pill button ── */}
            <button
                onClick={() => { setOpen((v) => !v); if (!open) load(); }}
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 shadow-lg border border-[var(--arbo-border)] transition-all hover:border-[var(--arbo-accent)]/40"
                style={{
                    background: "var(--arbo-surface-2)",
                    backdropFilter: "blur(12px)",
                }}
                title="Requests vía Arbo Forms hoy (no incluye otras apps)"
            >
                {/* Mini daily bar */}
                <div className="w-10 h-1.5 rounded-full overflow-hidden bg-[var(--arbo-border)] shrink-0">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: error ? "100%" : `${dailyPct * 100}%`,
                            background: error ? "#F87171" : dailyColor,
                        }}
                    />
                </div>

                <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: error ? "#F87171" : dailyColor }}
                >
                    {pillLabel}
                </span>

                <SparkIcon />
            </button>
        </div>
    );
};
