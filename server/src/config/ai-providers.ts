/**
 * Registry + config for AI providers with automatic failover.
 * All providers expose an OpenAI-compatible /chat/completions endpoint.
 *
 * API keys are stored per-user in User.aiProviders (JSONB).
 * System env vars (OPENROUTER_API_KEY, GROQ_API_KEY, …) serve as the
 * platform-level fallback when no user key is configured.
 */

import { getOpenRouterConfig } from "./openrouter-settings";

export interface AIProviderMeta {
    id: string;
    label: string;
    url: string;
    defaultModel: string;
    defaultDailyLimit: number;
    keyHint: string;
    docsUrl: string;
}

export const AI_PROVIDERS: AIProviderMeta[] = [
    {
        id: "openrouter",
        label: "OpenRouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        defaultModel: "deepseek/deepseek-r1:free",
        defaultDailyLimit: 50,
        keyHint: "sk-or-v1-…",
        docsUrl: "https://openrouter.ai/keys",
    },
    {
        id: "groq",
        label: "Groq",
        url: "https://api.groq.com/openai/v1/chat/completions",
        defaultModel: "llama-3.3-70b-versatile",
        defaultDailyLimit: 1000,
        keyHint: "gsk_…",
        docsUrl: "https://console.groq.com/keys",
    },
    {
        id: "gemini",
        label: "Google Gemini",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        defaultModel: "gemini-2.0-flash",
        defaultDailyLimit: 250,
        keyHint: "AIza…",
        docsUrl: "https://aistudio.google.com/apikey",
    },
    {
        id: "mistral",
        label: "Mistral",
        url: "https://api.mistral.ai/v1/chat/completions",
        defaultModel: "mistral-small-latest",
        defaultDailyLimit: 500,
        keyHint: "…",
        docsUrl: "https://console.mistral.ai/api-keys",
    },
    {
        id: "cohere",
        label: "Cohere",
        url: "https://api.cohere.ai/compatibility/v1/chat/completions",
        defaultModel: "command-r7b-12-2024",
        defaultDailyLimit: 30,
        keyHint: "…",
        docsUrl: "https://dashboard.cohere.com/api-keys",
    },
];

export interface AIProviderConfig {
    apiKey?: string;
    model?: string;
    enabled?: boolean;
    dailyLimit?: number;
    /** Where the resolved apiKey came from: the user's own DB key or the platform env key. */
    keySource?: "user" | "system";
}

export interface AIProvidersConfig {
    order: string[];
    providers: Record<string, AIProviderConfig>;
}

const ENV_KEYS: Record<string, string | undefined> = {
    openrouter: process.env.OPENROUTER_API_KEY,
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    cohere: process.env.COHERE_API_KEY,
};

/**
 * Build the resolved provider config from a user's DB-stored aiProviders field.
 * Falls back to system env vars for any provider the user hasn't configured.
 *
 * @param userDbProviders - raw value from User.aiProviders (JSONB), or null/undefined
 */
export function getAIProvidersConfig(userDbProviders?: any): AIProvidersConfig {
    const raw: AIProvidersConfig = userDbProviders
        ? {
            order: Array.isArray(userDbProviders.order) ? userDbProviders.order : [],
            providers: userDbProviders.providers || {},
          }
        : { order: [], providers: {} };

    const legacy = getOpenRouterConfig();

    const providers: Record<string, AIProviderConfig> = {};
    for (const meta of AI_PROVIDERS) {
        const saved = raw.providers[meta.id] || {};
        let apiKey = saved.apiKey || ENV_KEYS[meta.id] || undefined;
        let model = saved.model || meta.defaultModel;

        if (meta.id === "openrouter") {
            // User DB key wins; otherwise fall back to env; legacy model prefs still apply
            apiKey = saved.apiKey || ENV_KEYS.openrouter || undefined;
            model = saved.model || legacy.model || meta.defaultModel;
        }

        providers[meta.id] = {
            apiKey,
            model,
            enabled: saved.enabled ?? true,
            dailyLimit: saved.dailyLimit ?? meta.defaultDailyLimit,
            // The user's own key wins over env, so usage is attributed to them.
            keySource: saved.apiKey ? "user" : "system",
        };
    }

    const validIds = AI_PROVIDERS.map((p) => p.id);
    const order = [
        ...raw.order.filter((id) => validIds.includes(id)),
        ...validIds.filter((id) => !raw.order.includes(id)),
    ];

    return { order, providers };
}

/**
 * Returns an updated aiProviders object to be saved to User.aiProviders in the DB.
 * Pure — does not touch the filesystem.
 */
export function buildAIProviderUpdate(
    current: any,
    id: string,
    updates: Partial<AIProviderConfig>,
): any {
    // Always create new objects so Sequelize detects the JSONB change
    const providers: Record<string, AIProviderConfig> = { ...(current?.providers || {}) };
    const prev = providers[id] || {};
    providers[id] = {
        ...prev,
        ...(updates.apiKey !== undefined && { apiKey: updates.apiKey || undefined }),
        ...(updates.model !== undefined && { model: updates.model || undefined }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        ...(updates.dailyLimit !== undefined && { dailyLimit: updates.dailyLimit }),
    };
    return { order: [...(current?.order || [])], providers };
}

/**
 * Returns an updated aiProviders object with a new failover order.
 * Pure — does not touch the filesystem.
 */
export function buildAIProviderOrderUpdate(current: any, order: string[]): any {
    const validIds = AI_PROVIDERS.map((p) => p.id);
    return {
        order: order.filter((id) => validIds.includes(id)),
        providers: { ...(current?.providers || {}) },
    };
}
