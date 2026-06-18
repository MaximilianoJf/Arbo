/**
 * Multi-provider AI caller with automatic failover.
 * Walks the configured providers in priority order; when one is out of quota
 * (HTTP 429 / quota errors) it gets marked exhausted and the next configured
 * key takes over automatically.
 */

import { AI_PROVIDERS, getAIProvidersConfig } from "../config/ai-providers.js";
import User from "../models/User.model.js";
import {
    trackProviderRequest, markProviderExhausted, recordProviderError,
    isProviderExhausted, getProviderUsage,
} from "../config/ai-usage-stats.js";
import { callOpenRouter } from "./openrouter-call.js";
import { getOpenRouterConfig, DEFAULT_VISION_MODEL } from "../config/openrouter-settings.js";

// Vision-capable free fallbacks (verified against the OpenRouter catalog)
export const FALLBACK_VISION_MODELS = [
    DEFAULT_VISION_MODEL,                                   // google/gemma-4-31b-it:free
    "google/gemma-4-26b-a4b-it:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

/** Message content: plain text or OpenAI-style multimodal parts (text + image_url). */
export type AIMessageContent = string | { type: string; [key: string]: any }[];
export interface AIMessage { role: string; content: AIMessageContent }

export interface AICallOptions {
    temperature?: number;
    max_tokens?: number;
    /** Force a specific model (e.g. a vision-capable one for image scanning). */
    overrideModel?: string;
    /** Skip the free-model fallback chain (e.g. text models can't handle images). */
    disableFallback?: boolean;
    /** Tool definitions (OpenAI function-calling format). When set, returns raw choice instead of just content. */
    tools?: any[];
    /** When provided, the user's AI provider config is loaded from the DB instead of env-only. */
    userId?: number;
}

export interface AICallResult {
    content: string;
    modelUsed: string;
    provider: string;
    /** Populated when options.tools is set — raw tool_calls from the model. */
    tool_calls?: any[];
}

function isQuotaError(status: number, msg: string): boolean {
    if (status === 429) return true;
    const m = msg.toLowerCase();
    return (
        m.includes("quota") ||
        m.includes("rate limit") ||
        m.includes("rate-limit") ||
        m.includes("ratelimit") ||
        m.includes("limit exceeded") ||
        m.includes("exhausted") ||
        m.includes("insufficient") ||
        m.includes("too many requests")
    );
}

/** Quota errors that mention a daily window block the provider until the UTC reset; the rest cool down 10 min. */
function exhaustionDeadline(msg: string): Date {
    const m = msg.toLowerCase();
    if (m.includes("daily") || m.includes("per day") || m.includes("quota")) {
        const tomorrow = new Date(new Date().toISOString().slice(0, 10));
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        return tomorrow;
    }
    return new Date(Date.now() + 10 * 60 * 1000);
}

async function callOpenAICompatible(
    url: string,
    apiKey: string,
    model: string,
    messages: AIMessage[],
    options: AICallOptions,
): Promise<{ content: string; tool_calls?: any[] }> {
    const body: any = {
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 4000,
    };
    if (options.tools?.length) {
        body.tools = options.tools;
        body.tool_choice = "auto";
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errMsg: string = (err as any).error?.message || (err as any).message || response.statusText;
        const e: any = new Error(errMsg);
        e.status = response.status;
        throw e;
    }

    const data = await response.json() as any;
    const msg = data.choices?.[0]?.message;
    const tool_calls = msg?.tool_calls?.length ? msg.tool_calls : undefined;
    const content = msg?.content ?? "";
    if (!tool_calls && !content) throw new Error("No response from AI model");
    return { content, tool_calls };
}

/** True when any message carries an image part (multimodal request). */
export const messagesHaveImage = (messages: AIMessage[]): boolean =>
    messages.some((m) => Array.isArray(m.content) && m.content.some((p) => p?.type === "image_url"));

/** Vision chain: the user-selected vision model first, then the verified free fallbacks. */
const getVisionModels = (): string[] => {
    const configured = getOpenRouterConfig().visionModel || DEFAULT_VISION_MODEL;
    return [configured, ...FALLBACK_VISION_MODELS.filter((m) => m !== configured)];
};

/**
 * Calls the first available provider; on quota errors moves on to the next configured one.
 * Requests that contain images are detected automatically and routed through
 * vision-capable models (no text-model fallback), unless overrideModel is set.
 */
export async function callAI(
    messages: AIMessage[],
    options: AICallOptions = {},
): Promise<AICallResult> {
    if (messagesHaveImage(messages) && !options.overrideModel) {
        const failures: string[] = [];
        for (const model of getVisionModels()) {
            try {
                return await callAI(messages, { ...options, overrideModel: model, disableFallback: true });
            } catch (e: any) {
                failures.push(e?.message || "error");
            }
        }
        throw new Error(`Ningún modelo de visión pudo procesar la imagen. ${failures.join(" | ")}`);
    }
    let userDbProviders: any = null;
    if (options.userId) {
        const userRow = await User.findByPk(options.userId);
        if (userRow) userDbProviders = userRow.aiProviders;
    }
    const config = getAIProvidersConfig(userDbProviders);
    const failures: string[] = [];
    let triedAny = false;

    for (const id of config.order) {
        const meta = AI_PROVIDERS.find((p) => p.id === id);
        const provider = config.providers[id];
        if (!meta || !provider?.apiKey || provider.enabled === false) continue;

        // Skip providers in cooldown or over their daily limit
        if (isProviderExhausted(id)) {
            failures.push(`[${meta.label}] en pausa por límite alcanzado`);
            continue;
        }
        const usage = getProviderUsage(id);
        const limit = provider.dailyLimit ?? meta.defaultDailyLimit;
        if (limit > 0 && usage.used >= limit) {
            failures.push(`[${meta.label}] límite diario local alcanzado (${usage.used}/${limit})`);
            continue;
        }

        triedAny = true;
        const model = options.overrideModel || provider.model || meta.defaultModel;

        try {
            let content: string;
            let tool_calls: any[] | undefined;
            let modelUsed = model;

            if (id === "openrouter") {
                if (options.tools?.length) {
                    // Tools require direct call — callOpenRouter doesn't support them
                    const result = await callOpenAICompatible(
                        "https://openrouter.ai/api/v1/chat/completions",
                        provider.apiKey, model, messages, options,
                    );
                    content = result.content;
                    tool_calls = result.tool_calls;
                } else {
                    // OpenRouter keeps its own free-model fallback chain
                    const result = await callOpenRouter(messages, { ...options, overrideModel: model });
                    content = result.content;
                    modelUsed = result.modelUsed;
                }
            } else {
                const result = await callOpenAICompatible(meta.url, provider.apiKey, model, messages, options);
                content = result.content;
                tool_calls = result.tool_calls;
            }

            trackProviderRequest(id, modelUsed);
            return { content, modelUsed, provider: id, tool_calls };
        } catch (e: any) {
            const msg: string = e?.message || "Error desconocido";
            const status: number = e?.status ?? 0;

            // For OpenRouter, only a real HTTP 429 means the PROVIDER is out of quota.
            // Upstream texts like "model X is temporarily rate-limited upstream" are
            // model-level failures and must not pause the whole provider.
            const providerExhausted = id === "openrouter" ? status === 429 : isQuotaError(status, msg);

            if (providerExhausted) {
                // Out of quota → pause this provider and fail over to the next key
                markProviderExhausted(id, exhaustionDeadline(msg), msg);
                failures.push(`[${meta.label}] sin cuota: ${msg}`);
                continue;
            }

            // Bad key / network / model error → record it and still try the next provider
            recordProviderError(id, msg);
            failures.push(`[${meta.label}] ${msg}`);
            continue;
        }
    }

    if (!triedAny && failures.length === 0) {
        throw new Error("No hay ninguna API key de IA configurada. Agregá al menos una en /form-builder/settings/openrouter");
    }
    throw new Error(`Todos los proveedores de IA fallaron. ${failures.join(" | ")}`);
}
