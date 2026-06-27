import { Request, Response } from "express";
import { getOpenRouterConfig, saveOpenRouterConfig } from "../config/openrouter-settings";
import { getDailyStats } from "../config/openrouter-stats";
import { getAIProvidersConfig } from "../config/ai-providers";
import { getUserById, getUserByEmail } from "../repositories/user.repository";

const OPENROUTER_KEY_API = "https://openrouter.ai/api/v1/auth/key";

export const getOpenRouterSettings = (_req: Request, res: Response) => {
    const config = getOpenRouterConfig();
    res.json({
        ok: true,
        data: {
            hasApiKey: !!config.apiKey,
            apiKeyMasked: config.apiKey
                ? `sk-or-v1-${"•".repeat(20)}${config.apiKey.slice(-6)}`
                : null,
            model: config.model,
            visionModel: config.visionModel,
        },
    });
};

export const updateOpenRouterSettings = (req: Request, res: Response) => {
    const { apiKey, model, visionModel } = req.body as { apiKey?: string; model?: string; visionModel?: string };
    saveOpenRouterConfig({
        ...(apiKey !== undefined && { apiKey }),
        ...(model !== undefined && { model }),
        ...(visionModel !== undefined && { visionModel }),
    });
    res.json({ ok: true, msg: "Configuración actualizada" });
};

export const getOpenRouterModels = async (_req: Request, res: Response) => {
    const config = getOpenRouterConfig();
    if (!config.apiKey) {
        return res.status(400).json({ ok: false, msg: "No API key configured" });
    }
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: { Authorization: `Bearer ${config.apiKey}` },
        });
        if (!response.ok) {
            return res.status(response.status).json({ ok: false, msg: "Error al obtener modelos de OpenRouter" });
        }
        const data = await response.json() as any;
        const freeModels = (data.data as any[])
            .filter((m) => {
                const free = parseFloat(m.pricing?.prompt ?? "1") === 0 && parseFloat(m.pricing?.completion ?? "1") === 0;
                if (!free) return false;
                // Only chat-usable models: text input AND text-only output.
                // Excludes music (Lyria), audio, image-generation and embedding models.
                const inMods: string[] = m.architecture?.input_modalities ?? [];
                const outMods: string[] = m.architecture?.output_modalities ?? [];
                return inMods.includes("text") && outMods.length === 1 && outMods[0] === "text";
            })
            .map((m) => ({
                id: m.id,
                name: m.name,
                contextLength: m.context_length ?? 0,
                description: m.description ?? "",
                vision: (m.architecture?.input_modalities ?? []).includes("image"),
            }))
            .sort((a, b) => b.contextLength - a.contextLength);
        return res.json({ ok: true, data: freeModels });
    } catch {
        return res.status(500).json({ ok: false, msg: "Error al conectar con OpenRouter" });
    }
};

// Called by MCP server using X-API-Key — returns the actual key (not masked).
// Scoped to the API-key owner: returns THAT user's configured OpenRouter key
// (falling back to the env key), instead of always handing out the global key.
export const getOpenRouterKeyForMcp = async (req: Request, res: Response) => {
    const userId = (req as any).apiKeyUserId as number | undefined;
    const user = userId ? await getUserById(userId) : null;
    const resolved = getAIProvidersConfig(user?.aiProviders).providers.openrouter;
    const apiKey = resolved?.apiKey;
    if (!apiKey) {
        return res.status(400).json({ ok: false, msg: "OpenRouter API key not configured. Set it in /form-builder/settings/openrouter" });
    }
    return res.json({ ok: true, data: { apiKey, model: resolved.model } });
};

// ─── Embedding settings (stored in User.aiProviders.embeddings) ─────────────

export const getEmbeddingSettings = async (req: Request, res: Response) => {
    const user = req.email ? await getUserByEmail(req.email).catch(() => null) : null;
    if (!user) return res.status(401).json({ ok: false, msg: "Unauthorized" });
    const cfg = user.aiProviders?.embeddings || {};
    const envKey = process.env.GEMINI_EMBEDDING_API_KEY;
    return res.json({
        ok: true,
        data: {
            hasApiKey: !!(cfg.apiKey || envKey),
            apiKeyMasked: cfg.apiKey ? `AIza${"•".repeat(16)}${cfg.apiKey.slice(-4)}` : (envKey ? "(desde .env)" : null),
            model: cfg.model || process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
            usingEnvKey: !cfg.apiKey && !!envKey,
        },
    });
};

export const updateEmbeddingSettings = async (req: Request, res: Response) => {
    const user = req.email ? await getUserByEmail(req.email).catch(() => null) : null;
    if (!user) return res.status(401).json({ ok: false, msg: "Unauthorized" });
    const { apiKey, model } = req.body as { apiKey?: string; model?: string };
    const current = user.aiProviders || {};
    const embeddings = { ...(current.embeddings || {}) };
    if (apiKey !== undefined) embeddings.apiKey = apiKey || undefined;
    if (model !== undefined) embeddings.model = model || undefined;
    await user.update({ aiProviders: { ...current, embeddings } });
    return res.json({ ok: true, msg: "Configuración de embeddings actualizada" });
};

// ─── Qdrant settings (stored in User.aiProviders.qdrant) ────────────────────

export const getQdrantSettings = async (req: Request, res: Response) => {
    const user = req.email ? await getUserByEmail(req.email).catch(() => null) : null;
    if (!user) return res.status(401).json({ ok: false, msg: "Unauthorized" });
    const cfg = user.aiProviders?.qdrant || {};
    const envUrl = process.env.QDRANT_URL;
    const envKey = process.env.QDRANT_API_KEY;
    return res.json({
        ok: true,
        data: {
            url: cfg.url || envUrl || "",
            hasApiKey: !!(cfg.apiKey || envKey),
            apiKeyMasked: cfg.apiKey ? `${"•".repeat(20)}${cfg.apiKey.slice(-4)}` : (envKey ? "(desde .env)" : null),
            usingEnvConfig: !cfg.url && !!envUrl,
        },
    });
};

export const updateQdrantSettings = async (req: Request, res: Response) => {
    const user = req.email ? await getUserByEmail(req.email).catch(() => null) : null;
    if (!user) return res.status(401).json({ ok: false, msg: "Unauthorized" });
    const { url, apiKey } = req.body as { url?: string; apiKey?: string };
    const current = user.aiProviders || {};
    const qdrant = { ...(current.qdrant || {}) };
    if (url !== undefined) qdrant.url = url || undefined;
    if (apiKey !== undefined) qdrant.apiKey = apiKey || undefined;
    await user.update({ aiProviders: { ...current, qdrant } });
    return res.json({ ok: true, msg: "Configuración de Qdrant actualizada" });
};

export const getOpenRouterUsage = async (req: Request, res: Response) => {
    // Prefer the user's DB-stored key over the global env key
    const user = req.email ? await getUserByEmail(req.email).catch(() => null) : null;
    const userKey = user ? getAIProvidersConfig(user.aiProviders).providers.openrouter?.apiKey : undefined;
    const config = getOpenRouterConfig();
    const apiKey = userKey || config.apiKey;
    if (!apiKey) {
        return res.status(400).json({ ok: false, msg: "No hay API key configurada" });
    }

    try {
        const response = await fetch(OPENROUTER_KEY_API, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return res.status(response.status).json({
                ok: false,
                msg: (err as any)?.error?.message || "Error al consultar OpenRouter",
            });
        }

        const data = await response.json() as any;
        return res.json({
            ok: true,
            data: {
                ...data.data,
                daily: getDailyStats(),
            },
        });
    } catch {
        return res.status(500).json({ ok: false, msg: "Error al conectar con OpenRouter" });
    }
};
