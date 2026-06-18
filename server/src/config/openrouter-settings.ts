import fs from "fs";
import path from "path";

const CONFIG_PATH = path.resolve(process.cwd(), "data/openrouter-config.json");
const DEFAULT_MODEL = "deepseek/deepseek-r1:free";

export interface OpenRouterConfig {
    apiKey?: string;
    model: string;
}

function ensureDataDir(): void {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

export function getOpenRouterConfig(): OpenRouterConfig {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
            const parsed = JSON.parse(raw);
            return {
                apiKey: parsed.apiKey || process.env.OPENROUTER_API_KEY || undefined,
                model: parsed.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
            };
        }
    } catch { /* ignore */ }

    return {
        apiKey: process.env.OPENROUTER_API_KEY || undefined,
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    };
}

export function saveOpenRouterConfig(updates: Partial<OpenRouterConfig>): void {
    ensureDataDir();
    const current = getOpenRouterConfig();
    const updated: OpenRouterConfig = {
        apiKey: updates.apiKey !== undefined ? (updates.apiKey || undefined) : current.apiKey,
        model: updates.model || current.model,
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
}
