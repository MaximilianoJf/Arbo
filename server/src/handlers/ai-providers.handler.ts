import { Request, Response } from "express";
import {
    AI_PROVIDERS, getAIProvidersConfig,
    buildAIProviderUpdate, buildAIProviderOrderUpdate,
} from "../config/ai-providers";
import { getProviderUsage, todayUTC, nextResetUTC } from "../config/ai-usage-stats";
import { getUserByEmail } from "../repositories/user.repository";
import { saveOpenRouterConfig } from "../config/openrouter-settings";

const maskKey = (key: string): string =>
    key.length <= 8 ? "••••••" : `${key.slice(0, 4)}${"•".repeat(12)}${key.slice(-4)}`;

/** Full provider list with masked keys, usage stats and failover order. */
export const getAIProviders = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, msg: "Unauthorized" });

        const config = getAIProvidersConfig(user.aiProviders);

        const providers = await Promise.all(config.order.map(async (id) => {
            const meta = AI_PROVIDERS.find((p) => p.id === id)!;
            const cfg = config.providers[id];
            // Show the consumption of whichever key applies to this user: their own
            // key's scope, or the shared "system" scope when they use the env key.
            const scope = cfg.keySource === "user" ? `user:${user.id}` : "system";
            const stats = await getProviderUsage(scope, id);
            const limit = cfg.dailyLimit ?? meta.defaultDailyLimit;
            const exhausted = !!stats.exhaustedUntil && new Date(stats.exhaustedUntil).getTime() > Date.now();
            return {
                id,
                label: meta.label,
                keyHint: meta.keyHint,
                docsUrl: meta.docsUrl,
                defaultModel: meta.defaultModel,
                hasApiKey: !!cfg.apiKey,
                apiKeyMasked: cfg.apiKey ? maskKey(cfg.apiKey) : null,
                keySource: cfg.keySource,
                model: cfg.model || meta.defaultModel,
                enabled: cfg.enabled !== false,
                dailyLimit: limit,
                usage: {
                    used: stats.used,
                    remaining: Math.max(0, limit - stats.used),
                    lastUsedAt: stats.lastUsedAt || null,
                    lastModel: stats.lastModel || null,
                    lastError: stats.lastError || null,
                    exhausted,
                    exhaustedUntil: exhausted ? stats.exhaustedUntil : null,
                },
            };
        }));

        return res.json({ ok: true, data: { providers, date: todayUTC(), resetAt: nextResetUTC() } });
    } catch (err: any) {
        return res.status(500).json({ ok: false, msg: err.message });
    }
};

/** Update one provider: key, model, enabled, daily limit. */
export const updateAIProvider = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, msg: "Unauthorized" });

        const { id } = req.params;
        if (!AI_PROVIDERS.some((p) => p.id === id)) {
            return res.status(404).json({ ok: false, msg: "Proveedor desconocido" });
        }

        const { apiKey, model, enabled, dailyLimit } = req.body as {
            apiKey?: string; model?: string; enabled?: boolean; dailyLimit?: number;
        };

        user.aiProviders = buildAIProviderUpdate(user.aiProviders, id, {
            ...(apiKey !== undefined && { apiKey }),
            ...(model !== undefined && { model }),
            ...(enabled !== undefined && { enabled }),
            ...(dailyLimit !== undefined && { dailyLimit: Number(dailyLimit) || undefined }),
        });
        user.changed("aiProviders", true); // force Sequelize to detect JSONB change
        await user.save();

        // Keep legacy openrouter-config.json model prefs in sync (MCP + old widget read it)
        if (id === "openrouter" && model !== undefined) {
            saveOpenRouterConfig({ model });
        }

        return res.json({ ok: true, msg: "Proveedor actualizado" });
    } catch (err: any) {
        return res.status(500).json({ ok: false, msg: err.message });
    }
};

/** Update the failover priority order. */
export const updateAIProviderOrder = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, msg: "Unauthorized" });

        const { order } = req.body as { order?: string[] };
        if (!Array.isArray(order) || order.length === 0) {
            return res.status(400).json({ ok: false, msg: "Orden inválido" });
        }

        user.aiProviders = buildAIProviderOrderUpdate(user.aiProviders, order);
        user.changed("aiProviders", true); // force Sequelize to detect JSONB change
        await user.save();

        return res.json({ ok: true, msg: "Orden actualizado" });
    } catch (err: any) {
        return res.status(500).json({ ok: false, msg: err.message });
    }
};
