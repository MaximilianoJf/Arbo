import { getOpenRouterConfig } from "../config/openrouter-settings.js";
import { trackRequest } from "../config/openrouter-stats.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Priority fallback list — tried in order if the configured model is unavailable
const FALLBACK_FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "google/gemma-3-12b-it:free",
    "qwen/qwen3-8b:free",
    "mistralai/mistral-7b-instruct:free",
    "meta-llama/llama-3.1-8b-instruct:free",
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
}

export interface OpenRouterCallResult {
    content: string;
    modelUsed: string;
}

export async function callOpenRouter(
    messages: { role: string; content: string }[],
    options: OpenRouterCallOptions = {},
): Promise<OpenRouterCallResult> {
    const config = getOpenRouterConfig();
    if (!config.apiKey) {
        throw new Error("OpenRouter API key not configured. Configurá tu key en /form-builder/settings/openrouter");
    }

    const primaryModel = options.overrideModel || config.model;
    const modelsToTry = [primaryModel, ...FALLBACK_FREE_MODELS.filter((m) => m !== primaryModel)];

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
                const errMsg: string = (err as any).error?.message || response.statusText;
                if (isUnavailableError(errMsg)) {
                    lastError = `[${model}] ${errMsg}`;
                    continue;
                }
                throw new Error(`OpenRouter error: ${errMsg}`);
            }

            const data = await response.json() as any;
            const content = data.choices?.[0]?.message?.content;
            if (!content) throw new Error("No response from AI model");

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
