/**
 * Tracks daily OpenRouter request usage locally.
 * OpenRouter free tier: 50 requests/day (configurable via OPENROUTER_DAILY_LIMIT env).
 * Resets at midnight UTC based on stored date.
 */

import fs from "fs";
import path from "path";

const STATS_PATH = path.resolve(process.cwd(), "data/openrouter-stats.json");

export const FREE_TIER_DAILY_LIMIT = Number(process.env.OPENROUTER_DAILY_LIMIT ?? 50);

interface DailyStats {
    date: string;        // "YYYY-MM-DD" UTC
    requests: number;    // calls made today
}

function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

function ensureDataDir(): void {
    const dir = path.dirname(STATS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readStats(): DailyStats {
    try {
        if (fs.existsSync(STATS_PATH)) {
            const raw = fs.readFileSync(STATS_PATH, "utf-8");
            const parsed: DailyStats = JSON.parse(raw);
            // Reset if it's a new day
            if (parsed.date === todayUTC()) return parsed;
        }
    } catch { /* ignore */ }
    return { date: todayUTC(), requests: 0 };
}

function writeStats(stats: DailyStats): void {
    ensureDataDir();
    fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2), "utf-8");
}

/** Increment today's request count. Call after each successful OpenRouter call. */
export function trackRequest(): void {
    const stats = readStats();
    stats.requests += 1;
    writeStats(stats);
}

/** Get today's stats: used, remaining, limit, resetAt (next midnight UTC). */
export function getDailyStats() {
    const stats = readStats();
    const used = stats.requests;
    const remaining = Math.max(0, FREE_TIER_DAILY_LIMIT - used);

    // Next midnight UTC
    const tomorrow = new Date(todayUTC());
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    return {
        used,
        remaining,
        limit: FREE_TIER_DAILY_LIMIT,
        resetAt: tomorrow.toISOString(),
        date: stats.date,
    };
}
