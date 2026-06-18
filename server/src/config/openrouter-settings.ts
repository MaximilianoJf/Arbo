import fs from "fs";
import path from "path";

const CONFIG_PATH = path.resolve(process.cwd(), "data/openrouter-config.json");
const DEFAULT_MODEL = "moonshotai/kimi-k2.6:free";
export const DEFAULT_VISION_MODEL = "google/gemma-4-31b-it:free";

export interface OpenRouterConfig {
    apiKey?: string;
    model: string;
    /** Model used when the request contains images (photo scanning). */
    visionModel: string;
}

function ensureDataDir(): void {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function readPrefs(): { model?: string; visionModel?: string } {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
        }
    } catch { /* ignore */ }
    return {};
}

export function getOpenRouterConfig(): OpenRouterConfig {
    const prefs = readPrefs();
    return {
        // API key always comes from env — never stored in files
        apiKey: process.env.OPENROUTER_API_KEY || undefined,
        model: prefs.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        visionModel: prefs.visionModel || DEFAULT_VISION_MODEL,
    };
}

export function saveOpenRouterConfig(updates: Partial<OpenRouterConfig>): void {
    ensureDataDir();
    const prefs = readPrefs();
    // apiKey intentionally excluded — must be set via OPENROUTER_API_KEY in server/.env
    const updated = {
        model: updates.model || prefs.model || DEFAULT_MODEL,
        visionModel: updates.visionModel || prefs.visionModel || DEFAULT_VISION_MODEL,
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
}
