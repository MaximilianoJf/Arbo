/**
 * Per-provider daily usage tracking for the AI failover system.
 * Counts requests per provider per UTC day and remembers when a provider
 * got rate-limited / out of quota so the failover can skip it.
 */

import fs from "fs";
import path from "path";

const STATS_PATH = path.resolve(process.cwd(), "data/ai-usage-stats.json");

export interface ProviderDayStats {
    used: number;
    lastUsedAt?: string;       // ISO timestamp of last successful call
    lastModel?: string;        // last model that answered
    lastError?: string;        // last failure reason (for the panel)
    exhaustedUntil?: string;   // ISO timestamp — skip this provider until then
}

interface UsageFile {
    date: string;  // "YYYY-MM-DD" UTC
    providers: Record<string, ProviderDayStats>;
}

function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

function ensureDataDir(): void {
    const dir = path.dirname(STATS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readStats(): UsageFile {
    try {
        if (fs.existsSync(STATS_PATH)) {
            const parsed: UsageFile = JSON.parse(fs.readFileSync(STATS_PATH, "utf-8"));
            if (parsed.date === todayUTC()) return { date: parsed.date, providers: parsed.providers || {} };
        }
    } catch { /* ignore */ }
    return { date: todayUTC(), providers: {} };
}

function writeStats(stats: UsageFile): void {
    ensureDataDir();
    // Fire-and-forget async write so request handling never blocks on disk I/O.
    fs.writeFile(STATS_PATH, JSON.stringify(stats, null, 2), "utf-8", () => {});
}

function getOrInit(stats: UsageFile, provider: string): ProviderDayStats {
    if (!stats.providers[provider]) stats.providers[provider] = { used: 0 };
    return stats.providers[provider];
}

/** Count a successful call for the provider. */
export function trackProviderRequest(provider: string, model?: string): void {
    const stats = readStats();
    const p = getOrInit(stats, provider);
    p.used += 1;
    p.lastUsedAt = new Date().toISOString();
    if (model) p.lastModel = model;
    p.lastError = undefined;
    p.exhaustedUntil = undefined;
    writeStats(stats);
}

/** Mark a provider as exhausted (rate-limited / out of quota) until the given time. */
export function markProviderExhausted(provider: string, until: Date, reason: string): void {
    const stats = readStats();
    const p = getOrInit(stats, provider);
    p.exhaustedUntil = until.toISOString();
    p.lastError = reason.slice(0, 300);
    writeStats(stats);
}

/** Record a non-quota failure (bad key, network) without blocking the provider. */
export function recordProviderError(provider: string, reason: string): void {
    const stats = readStats();
    const p = getOrInit(stats, provider);
    p.lastError = reason.slice(0, 300);
    writeStats(stats);
}

/** True when the provider is currently marked exhausted. */
export function isProviderExhausted(provider: string): boolean {
    const stats = readStats();
    const until = stats.providers[provider]?.exhaustedUntil;
    return !!until && new Date(until).getTime() > Date.now();
}

/** Today's usage for one provider. */
export function getProviderUsage(provider: string): ProviderDayStats {
    const stats = readStats();
    return stats.providers[provider] || { used: 0 };
}

/** Full per-provider snapshot for the consumption panel. */
export function getAllProviderUsage(): { date: string; resetAt: string; providers: Record<string, ProviderDayStats> } {
    const stats = readStats();
    const tomorrow = new Date(todayUTC());
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return { date: stats.date, resetAt: tomorrow.toISOString(), providers: stats.providers };
}
