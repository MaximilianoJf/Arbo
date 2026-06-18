import { getOpenRouterConfig } from "../config/openrouter-settings.js";
import { trackRequest } from "../config/openrouter-stats.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Priority fallback list — tried in order if the configured model is unavailable.
// Verified against the OpenRouter catalog (Jun 2026); update if models get retired.
const FALLBACK_FREE_MODELS = [
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "deepseek/deepseek-v4-flash:free",
    "google/gemma-4-31b-it:free",   // last: rejects the system role via Google AI Studio
];

function isUnavailableError(msg: string): boolean {
    return (
        msg.includes("No endpoints found") ||
        msg.includes("unavailable") ||
        msg.includes("not found for free") ||
        msg.includes("model not found") ||
        msg.includes("is deprecated")
    );
}

export interface OpenRouterCallOptions {
    temperature?: number;
    max_tokens?: number;
    overrideModel?: string;
    /** Try only the primary model, without the free-model fallback chain. */
    disableFallback?: boolean;
}

export interface OpenRouterCallResult {
    content: string;
    modelUsed: string;
}

export async function callOpenRouter(
    messages: { role: string; content: string | { type: string; [key: string]: any }[] }[],
    options: OpenRouterCallOptions = {},
): Promise<OpenRouterCallResult> {
    const config = getOpenRouterConfig();
    if (!config.apiKey) {
        throw new Error("OpenRouter API key not configured. Configurá tu key en /form-builder/settings/openrouter");
    }

    const primaryModel = options.overrideModel || config.model;
    const modelsToTry = options.disableFallback
        ? [primaryModel]
        : [primaryModel, ...FALLBACK_FREE_MODELS.filter((m) => m !== primaryModel)];

    let lastError = "";

    for (const model of modelsToTry) {
        try {
            const response = await fetch(OPENROUTER_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${config.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
                    "X-Title": "Arbo Forms",
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: options.temperature ?? 0.3,
                    max_tokens: options.max_tokens ?? 4000,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                // Include the upstream provider's raw error — "Provider returned error" alone is useless
                const raw = (err as any).error?.metadata?.raw;
                const rawStr = raw ? ` — ${typeof raw === "string" ? raw : JSON.stringify(raw)}`.slice(0, 300) : "";
                const errMsg: string = ((err as any).error?.message || response.statusText) + rawStr;
                // 404/400 = modelo inexistente o dado de baja → probar el siguiente de la cadena
                if (response.status === 404 || response.status === 400 || isUnavailableError(errMsg)) {
                    lastError = `[${model}] ${errMsg}`;
                    continue;
                }
                throw new Error(`OpenRouter error: ${errMsg}`);
            }

            const data = await response.json() as any;
            const msg = data.choices?.[0]?.message;
            // Some reasoning models (kimi, deepseek-r1, etc.) put the final answer in
            // `content` and the chain-of-thought in `reasoning` / `reasoning_content`.
            // If content is empty but reasoning exists, fall back to reasoning text.
            let content: string =
                (typeof msg?.content === "string" ? msg.content : "").trim() ||
                (typeof msg?.reasoning_content === "string" ? msg.reasoning_content : "").trim() ||
                (typeof msg?.reasoning === "string" ? msg.reasoning : "").trim() ||
                (Array.isArray(msg?.content)
                    ? (msg.content as any[]).map((c) => (typeof c === "string" ? c : c?.text ?? "")).join("")
                    : "");
            if (!content) {
                // Treat as unavailable so the fallback chain continues to the next model
                lastError = `[${model}] No response content`;
                continue;
            }

            trackRequest(); // count every successful generation
            return { content, modelUsed: model };
        } catch (e: any) {
            if (isUnavailableError(e.message || "")) {
                lastError = `[${model}] ${e.message}`;
                continue;
            }
            throw e;
        }
    }

    throw new Error(`Todos los modelos fallaron. Último error: ${lastError}`);
}
