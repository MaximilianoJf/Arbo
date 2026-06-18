/**
 * AI Analysis Service — Uses OpenRouter to analyze form responses.
 *
 * ─── SETUP GUIDE ─────────────────────────────────────────────────────
 *
 * 1. Go to https://openrouter.ai and create an account
 * 2. Navigate to https://openrouter.ai/keys and create a new API key
 * 3. Add to your .env file:
 *
 *      OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
 *      OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
 *
 * ─── FREE / GENEROUS MODELS (as of 2024–2025) ───────────────────────
 *
 *   Model ID                                    | Context | Notes
 *   ─────────────────────────────────────────────┼─────────┼──────────────
 *   google/gemini-2.0-flash-exp:free             | 1M      | Best free option, fast, smart
 *   google/gemma-2-9b-it:free                    | 8K      | Good for short analyses
 *   meta-llama/llama-3.1-8b-instruct:free        | 131K    | Solid free alternative
 *   mistralai/mistral-7b-instruct:free           | 32K     | Fast, good quality
 *   qwen/qwen-2.5-7b-instruct:free              | 32K     | Good multilingual
 *
  *   RECOMMENDED: deepseek/deepseek-r1:free
 *   → 163K context, free, excellent reasoning
 *
 * ─── CHEAP PAID OPTIONS (if you want better quality) ────────────────
 *
 *   google/gemini-2.0-flash-001         | ~$0.10/1M tokens | Best value
 * *   openai/gpt-4o-mini                  | ~$0.15/1M tokens | Good balance
 *
 * ────────────────────────────────────────────────────────────────────
 */

import { callAI } from "../utils/ai-call.js";

interface AnalysisInput {
    formTitle: string;
    formDescription?: string;
    fields: { name: string; label: string; type: string; componentType: string }[];
    responses: { answers: Record<string, any>; respondentName?: string; respondentEmail?: string; createdAt?: string }[];
}

interface AnalysisResult {
    summary: string;
    insights: string[];
    patterns: string[];
    suggestions: string[];
    sentiment: string;
    responseRate: { total: number; complete: number; incomplete: number };
}

const buildPrompt = (input: AnalysisInput): string => {
    const fieldList = input.fields
        .filter((f) => !f.name.startsWith("__page_break_"))
        .map((f) => `  - "${f.label}" (${f.type}, ${f.componentType})`)
        .join("\n");

    // Build a compact data table
    const dataRows = input.responses.slice(0, 200).map((r, i) => {
        const values = input.fields
            .filter((f) => !f.name.startsWith("__page_break_"))
            .map((f) => {
                const val = r.answers[f.name];
                if (val === null || val === undefined || val === "") return "—";
                if (Array.isArray(val)) return val.join(", ");
                return String(val);
            });
        return `${i + 1}. [${r.respondentName || "Anon"}] ${values.join(" | ")}`;
    }).join("\n");

    return `You are a data analyst. Analyze these form responses and provide actionable insights.

FORM: "${input.formTitle}"
${input.formDescription ? `Description: ${input.formDescription}` : ""}

FIELDS:
${fieldList}

RESPONSES (${input.responses.length} total):
${dataRows}

Respond ONLY with valid JSON (no markdown, no code fences) matching this exact structure:
{
  "summary": "2-3 sentence overview of the data",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "patterns": ["pattern 1", "pattern 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "sentiment": "overall sentiment: positive/neutral/negative/mixed",
  "responseRate": {
    "total": ${input.responses.length},
    "complete": <number of responses with all required fields filled>,
    "incomplete": <number of responses with missing fields>
  }
}

Write insights and suggestions in neutral Spanish (no regional slang). Be specific to the actual data, not generic.`;
};

export const analyzeResponses = async (input: AnalysisInput, customPrompt?: string, userId?: number): Promise<AnalysisResult> => {
    const basePrompt = buildPrompt(input);
    const finalPrompt = customPrompt
        ? `${basePrompt}\n\nADEMÁS, el usuario tiene una consulta específica:\n${customPrompt}`
        : basePrompt;

    const { content } = await callAI(
        [{ role: "user", content: finalPrompt }],
        { temperature: 0.3, max_tokens: 3000, userId },
    );

    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
        return JSON.parse(cleaned) as AnalysisResult;
    } catch {
        return {
            summary: content,
            insights: [],
            patterns: [],
            suggestions: [],
            sentiment: "unknown",
            responseRate: { total: input.responses.length, complete: 0, incomplete: 0 },
        };
    }
};
