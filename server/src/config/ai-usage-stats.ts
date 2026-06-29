/**
 * Per-scope, per-provider daily usage tracking for the AI failover system.
 *
 * Backed by Postgres (AiUsage model) so the count survives deploys/restarts
 * and is attributed to the real owner of the key that was used:
 *   - scope "system"     → the platform env key
 *   - scope "user:<id>"  → that user's own DB key
 *
 * A new UTC day = a new row that starts at 0, so the count resets exactly
 * when the real provider quota renews.
 */

import AiUsage from "../models/AiUsage.model.js";

/** "system" for the platform key, or "user:<id>" for a user's own key. */
export type UsageScope = string;

export interface ProviderDayStats {
    used: number;
    lastUsedAt?: string;       // ISO timestamp of last successful call
    lastModel?: string;        // last model that answered
    lastError?: string;        // last failure reason (for the panel)
    exhaustedUntil?: string;   // ISO timestamp — skip this provider until then
}

export function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

/** Next midnight UTC — when the daily counters reset. */
export function nextResetUTC(): string {
    const tomorrow = new Date(todayUTC());
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow.toISOString();
}

/** Find (or create) today's row for a scope+provider. */
async function getOrCreateRow(scope: UsageScope, provider: string): Promise<AiUsage> {
    const [row] = await AiUsage.findOrCreate({
        where: { scope, provider, date: todayUTC() },
        defaults: { scope, provider, date: todayUTC(), used: 0 },
    });
    return row;
}

function toStats(row: AiUsage | null): ProviderDayStats {
    if (!row) return { used: 0 };
    return {
        used: row.used,
        lastUsedAt: row.lastUsedAt?.toISOString(),
        lastModel: row.lastModel ?? undefined,
        lastError: row.lastError ?? undefined,
        exhaustedUntil: row.exhaustedUntil?.toISOString(),
    };
}

/** Count a successful call for the provider under this scope. */
export async function trackProviderRequest(scope: UsageScope, provider: string, model?: string): Promise<void> {
    const row = await getOrCreateRow(scope, provider);
    // Atomic increment so concurrent calls don't clobber each other's count.
    await row.increment("used");
    await row.update({
        lastUsedAt: new Date(),
        ...(model && { lastModel: model }),
        lastError: null,
        exhaustedUntil: null,
    });
}

/** Mark a provider as exhausted (rate-limited / out of quota) until the given time. */
export async function markProviderExhausted(scope: UsageScope, provider: string, until: Date, reason: string): Promise<void> {
    const row = await getOrCreateRow(scope, provider);
    await row.update({ exhaustedUntil: until, lastError: reason.slice(0, 300) });
}

/** Record a non-quota failure (bad key, network) without blocking the provider. */
export async function recordProviderError(scope: UsageScope, provider: string, reason: string): Promise<void> {
    const row = await getOrCreateRow(scope, provider);
    await row.update({ lastError: reason.slice(0, 300) });
}

/** True when the provider is currently marked exhausted for this scope. */
export async function isProviderExhausted(scope: UsageScope, provider: string): Promise<boolean> {
    const row = await AiUsage.findOne({ where: { scope, provider, date: todayUTC() } });
    const until = row?.exhaustedUntil;
    return !!until && until.getTime() > Date.now();
}

/** Today's usage for one provider under this scope. */
export async function getProviderUsage(scope: UsageScope, provider: string): Promise<ProviderDayStats> {
    const row = await AiUsage.findOne({ where: { scope, provider, date: todayUTC() } });
    return toStats(row);
}

/** Today's per-provider snapshot for one scope (for the consumption panel). */
export async function getScopeUsage(scope: UsageScope): Promise<{ date: string; resetAt: string; providers: Record<string, ProviderDayStats> }> {
    const rows = await AiUsage.findAll({ where: { scope, date: todayUTC() } });
    const providers: Record<string, ProviderDayStats> = {};
    for (const row of rows) providers[row.provider] = toStats(row);
    return { date: todayUTC(), resetAt: nextResetUTC(), providers };
}
