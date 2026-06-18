#!/usr/bin/env tsx
/**
 * Arbo Forms MCP Server
 *
 * Standalone MCP server that connects to the Arbo Forms backend.
 * Can read, analyze, create, update, publish and delete forms.
 *
 * Works with any MCP-compatible client (Cursor, Windsurf, etc.).
 *
 * ─── ENV VARS ─────────────────────────────────────────────────────
 *   ARBO_API_KEY   — API key created in /form-builder/api-keys
 *   ARBO_API_URL   — backend URL (default: http://localhost:4000/api)
 *   PORT           — if set, runs as HTTP/SSE server (for Render, Railway, etc.)
 *                    if not set, runs as stdio process (for local MCP clients)
 * ──────────────────────────────────────────────────────────────────
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import * as arbo from "./arbo-client.js";

const server = new McpServer({
    name: "arbo-forms",
    version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════════
//  READ TOOLS
// ═══════════════════════════════════════════════════════════════════

server.tool(
    "list_forms",
    "List all forms owned by this account with their fields, slug, and publish status.",
    {},
    async () => {
        try {
            const forms = await arbo.listForms();
            const summary = forms.map((f) => ({
                id: f.id,
                title: f.title,
                slug: f.slug,
                published: f.isPublished,
                fieldCount: f.fields.length,
                fields: f.fields.map((fld) => `${fld.label || fld.name} (${fld.componentType})`),
                created: f.createdAt,
            }));
            return { content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
        }
    },
);

server.tool(
    "get_form_responses",
    "Get all responses for a form as flattened rows with column metadata.",
    { formId: z.number().describe("The form ID") },
    async ({ formId }) => {
        try {
            const data = await arbo.getFormData(formId);
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify({ form: data.form, totalResponses: data.total, columns: data.columns, rows: data.rows }, null, 2),
                }],
            };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
        }
    },
);

server.tool(
    "analyze_responses",
    "Analyze responses for a form — per-field stats: value distribution, completion rate, numeric min/max/avg, time trends.",
    { formId: z.number().describe("The form ID to analyze") },
    async ({ formId }) => {
        try {
            const data = await arbo.getFormData(formId);
            if (data.total === 0) return { content: [{ type: "text" as const, text: "No responses to analyze." }] };

            const fieldCols = data.columns.filter((c) =>
                !["response_id", "respondent_name", "respondent_email", "submitted_at"].includes(c.name));
            const stats: Record<string, any> = {};

            for (const col of fieldCols) {
                const values = data.rows.map((r) => r[col.name]).filter((v) => v != null && v !== "");
                const filled = values.length;
                const freq: Record<string, number> = {};
                for (const v of values) { const k = String(v); freq[k] = (freq[k] || 0) + 1; }

                const stat: any = {
                    label: col.label || col.name, type: col.type,
                    filled, empty: data.total - filled,
                    completionRate: `${Math.round((filled / data.total) * 100)}%`,
                    uniqueValues: Object.keys(freq).length,
                    topValues: Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10)
                        .map(([value, count]) => ({ value, count, pct: `${Math.round((count / filled) * 100)}%` })),
                };

                if (col.type === "number") {
                    const nums = values.map(Number).filter((n) => !isNaN(n));
                    if (nums.length) { stat.min = Math.min(...nums); stat.max = Math.max(...nums); stat.avg = +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2); }
                }
                stats[col.name] = stat;
            }

            const dates = data.rows.map((r) => new Date(r.submitted_at)).filter((d) => !isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime());
            const timeStats = dates.length > 1 ? {
                first: dates[0].toISOString(), last: dates.at(-1)!.toISOString(),
                days: Math.ceil((dates.at(-1)!.getTime() - dates[0].getTime()) / 864e5) || 1,
                avgPerDay: +(dates.length / (Math.ceil((dates.at(-1)!.getTime() - dates[0].getTime()) / 864e5) || 1)).toFixed(2),
            } : null;

            return { content: [{ type: "text" as const, text: JSON.stringify({ form: data.form, overview: { totalResponses: data.total, fields: fieldCols.length, timeStats }, fieldStats: stats }, null, 2) }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
        }
    },
);

server.tool(
    "search_responses",
    "Filter responses by field values. Case-insensitive partial match.",
    {
        formId: z.number().describe("Form ID"),
        filters: z.record(z.string()).optional().describe("field_name → value to filter"),
        limit: z.number().optional().describe("Max results (default 50)"),
    },
    async ({ formId, filters, limit }) => {
        try {
            const data = await arbo.getFormData(formId);
            let rows = data.rows;
            if (filters && Object.keys(filters).length > 0) {
                rows = rows.filter((row) => Object.entries(filters).every(([k, v]) => {
                    const cell = row[k]; return cell != null && String(cell).toLowerCase().includes(v.toLowerCase());
                }));
            }
            const limited = rows.slice(0, limit || 50);
            return { content: [{ type: "text" as const, text: JSON.stringify({ form: data.form, matched: rows.length, showing: limited.length, rows: limited }, null, 2) }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
        }
    },
);

// ═══════════════════════════════════════════════════════════════════
//  WRITE TOOLS — Create & manage forms via chatbot
// ═══════════════════════════════════════════════════════════════════

/**
 * Component type reference for the AI:
 *
 *   DynamicTextField       → text, email, password, url, tel
 *   DynamicTextArea        → multiline text
 *   DynamicNumberField     → number
 *   DynamicSelect          → dropdown (needs options)
 *   DynamicCheckbox        → checkbox group (needs options)
 *   DynamicRadioGroup      → radio buttons (needs options)
 *   DynamicDateField       → date picker
 *   DynamicPasswordWithToggle → password with show/hide
 */

const fieldSchema = z.object({
    name: z.string().describe("Unique field identifier (snake_case, e.g. 'full_name')"),
    label: z.string().describe("Display label shown to the user"),
    type: z.string().describe("Input type: text, email, number, date, password, radio, checkbox, select, tel, url"),
    componentType: z.string().describe("UI component: DynamicTextField, DynamicTextArea, DynamicNumberField, DynamicSelect, DynamicCheckbox, DynamicRadioGroup, DynamicDateField, DynamicPasswordWithToggle"),
    placeholder: z.string().optional().describe("Placeholder text"),
    required: z.boolean().optional().describe("Whether the field is required"),
    options: z.array(z.string()).optional().describe("Options for Select, Checkbox, RadioGroup components"),
    sortOrder: z.number().optional().describe("Display order (0-based)"),
    page: z.number().optional().describe("Page number for multi-page forms (0-based)"),
    validations: z.array(z.string()).optional().describe("Validation rules: required, email, text, positiveNumber, confirmPassword"),
});

server.tool(
    "create_form",
    `Create a new form with fields. Use this when the user describes a form they want to build.

Component types and when to use them:
- DynamicTextField → short text (name, email, phone, url)
- DynamicTextArea → long text (comments, descriptions)
- DynamicNumberField → numbers (age, quantity, price)
- DynamicSelect → dropdown for single choice from many options
- DynamicRadioGroup → radio buttons for single choice from few options (2-6)
- DynamicCheckbox → checkboxes for multiple selections
- DynamicDateField → date picker
- DynamicPasswordWithToggle → password input

For email type, use componentType "DynamicTextField" with type "email".
For fields with options (Select, Checkbox, RadioGroup), include the options array.
Set required: true and validations: ["required"] for mandatory fields.`,
    {
        title: z.string().describe("Form title"),
        description: z.string().optional().describe("Form description"),
        fields: z.array(fieldSchema).describe("Array of fields to create"),
    },
    async ({ title, description, fields }) => {
        try {
            const form = await arbo.createForm({
                title,
                description,
                onSubmit: "SaveToDB",
                fields: fields.map((f, i) => ({
                    ...f,
                    sortOrder: f.sortOrder ?? i,
                    page: f.page ?? 0,
                })),
            });

            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify({
                        success: true,
                        message: `Form "${title}" created successfully`,
                        form: { id: form.id, title: form.title, slug: form.slug },
                        fieldsCreated: fields.length,
                        viewUrl: `/forms/${form.slug}`,
                        editUrl: `/form-builder/edit/${form.id}`,
                    }, null, 2),
                }],
            };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error creating form: ${err.message}` }], isError: true };
        }
    },
);

server.tool(
    "update_form",
    "Update an existing form — change title, description, or replace all fields.",
    {
        formId: z.number().describe("ID of the form to update"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description"),
        fields: z.array(fieldSchema).optional().describe("New fields (replaces all existing fields)"),
    },
    async ({ formId, title, description, fields }) => {
        try {
            const payload: any = {};
            if (title) payload.title = title;
            if (description !== undefined) payload.description = description;
            if (fields) payload.fields = fields.map((f, i) => ({ ...f, sortOrder: f.sortOrder ?? i, page: f.page ?? 0 }));

            const form = await arbo.updateForm(formId, payload);
            return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, message: `Form ${formId} updated`, form }, null, 2) }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
        }
    },
);

server.tool(
    "publish_form",
    "Publish or unpublish a form. Published forms are accessible via their public URL.",
    {
        formId: z.number().describe("Form ID"),
        published: z.boolean().describe("true to publish, false to unpublish"),
    },
    async ({ formId, published }) => {
        try {
            const result = await arbo.publishForm(formId, published);
            return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...result, publicUrl: published ? `/forms/${result.slug}` : null }, null, 2) }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
        }
    },
);

server.tool(
    "delete_form",
    "Move a form to trash (soft delete). Can be restored later from the app.",
    { formId: z.number().describe("Form ID to delete") },
    async ({ formId }) => {
        try {
            await arbo.deleteForm(formId);
            return { content: [{ type: "text" as const, text: `Form ${formId} moved to trash.` }] };
        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
        }
    },
);

// ═══════════════════════════════════════════════════════════════════
//  AI ANALYSIS — calls OpenRouter directly using backend-stored key
// ═══════════════════════════════════════════════════════════════════

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

server.tool(
    "analyze_forms_with_ai",
    `Analyze responses from one or multiple forms using AI. Provide a natural language prompt describing what you want to know.

Examples:
- "¿Cuál es el campo con menor tasa de respuesta y por qué crees que pasa?"
- "Resumí los patrones más importantes en todas las respuestas"
- "¿Qué sentimiento predomina en los comentarios libres?"
- "Compare las respuestas del formulario X con el Y"

The tool fetches live data from the database, compiles field-level stats and raw responses, then sends everything to the AI model configured in your OpenRouter settings.`,
    {
        prompt: z.string().describe("What you want to analyze or understand about the form responses"),
        formIds: z.array(z.number()).optional().describe("Specific form IDs to include. If omitted, all forms with responses are included."),
        includeRawResponses: z.boolean().optional().describe("Include individual response rows in the prompt (default: false, uses aggregated stats only)"),
        model: z.string().optional().describe("Override the OpenRouter model (e.g. 'google/gemini-2.0-flash-exp:free'). Defaults to backend config."),
    },
    async ({ prompt, formIds, includeRawResponses = false, model }) => {
        try {
            let orConfig: arbo.OpenRouterConfig;
            try {
                orConfig = await arbo.getOpenRouterConfig();
            } catch (e: any) {
                return {
                    content: [{ type: "text" as const, text: `Error: OpenRouter no configurado. Configurá tu API key en /form-builder/settings/openrouter\n\nDetalle: ${e.message}` }],
                    isError: true,
                };
            }

            const allForms = await arbo.listForms();
            const targetForms = formIds?.length
                ? allForms.filter((f) => formIds.includes(f.id))
                : allForms;

            if (targetForms.length === 0) {
                return { content: [{ type: "text" as const, text: "No se encontraron formularios para analizar." }] };
            }

            const formsData: arbo.FormDataResponse[] = [];
            for (const form of targetForms) {
                try {
                    const data = await arbo.getFormData(form.id);
                    if (data.total > 0) formsData.push(data);
                } catch { /* skip inaccessible forms */ }
            }

            if (formsData.length === 0) {
                return { content: [{ type: "text" as const, text: "Los formularios seleccionados no tienen respuestas todavía." }] };
            }

            const formSections = formsData.map((fd) => {
                const fieldCols = fd.columns.filter(
                    (c) => !["response_id", "respondent_name", "respondent_email", "submitted_at"].includes(c.name),
                );

                const fieldStats = fieldCols.map((col) => {
                    const values = fd.rows.map((r) => r[col.name]).filter((v) => v != null && v !== "");
                    const filled = values.length;
                    const freq: Record<string, number> = {};
                    for (const v of values) {
                        const k = String(v);
                        freq[k] = (freq[k] || 0) + 1;
                    }
                    const topValues = Object.entries(freq)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([v, c]) => `"${v}" ×${c}`)
                        .join(", ");

                    const nums = col.type === "number" ? values.map(Number).filter((n) => !isNaN(n)) : [];
                    const numStats = nums.length
                        ? ` | min:${Math.min(...nums)} max:${Math.max(...nums)} avg:${(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)}`
                        : "";

                    return `  • ${col.label || col.name} [${col.type}]: ${filled}/${fd.total} (${Math.round((filled / fd.total) * 100)}%) — ${topValues || "sin datos"}${numStats}`;
                }).join("\n");

                const rawSection = includeRawResponses
                    ? `\nRespuestas individuales (máx 50):\n${fd.rows.slice(0, 50).map((r, i) => {
                        const vals = fieldCols.map((c) => `${c.label || c.name}: ${r[c.name] ?? "—"}`).join(" | ");
                        return `  ${i + 1}. [${r.respondent_name || "Anón"}] ${vals}`;
                    }).join("\n")}`
                    : "";

                return `### Formulario: "${fd.form.title}" (ID ${fd.form.id}) — ${fd.total} respuestas\nCampos:\n${fieldStats}${rawSection}`;
            });

            const dataSummary = formSections.join("\n\n");
            const totalResponses = formsData.reduce((sum, fd) => sum + fd.total, 0);

            const systemPrompt = `Sos un analista de datos especializado en formularios web. Respondés en español neutro, con insights concretos basados únicamente en los datos proporcionados. Evitás generalidades y hacés referencia a valores y porcentajes reales.`;
            const userPrompt = `Tenés acceso a los datos de ${formsData.length} formulario(s) con un total de ${totalResponses} respuestas.\n\n${dataSummary}\n\n---\nCONSULTA: ${prompt}`;

            const response = await fetch(OPENROUTER_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${orConfig.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": process.env.ARBO_API_URL || "http://localhost:4000",
                    "X-Title": "Arbo Forms MCP Analyzer",
                },
                body: JSON.stringify({
                    model: model || orConfig.model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 4000,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                return {
                    content: [{ type: "text" as const, text: `OpenRouter error: ${(err as any).error?.message || response.statusText}` }],
                    isError: true,
                };
            }

            const aiData = await response.json() as any;
            const aiContent = aiData.choices?.[0]?.message?.content;

            if (!aiContent) {
                return { content: [{ type: "text" as const, text: "El modelo no devolvió respuesta." }], isError: true };
            }

            const meta = `*Modelo: ${model || orConfig.model} | Formularios: ${formsData.length} | Respuestas totales: ${totalResponses}*\n\n`;
            return { content: [{ type: "text" as const, text: meta + aiContent }] };

        } catch (err: any) {
            return { content: [{ type: "text" as const, text: `Error: ${err.message}` }], isError: true };
        }
    },
);

// ═══════════════════════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════════════════════

server.tool(
    "connection_status",
    "Check connectivity to the Arbo Forms backend.",
    {},
    async () => {
        const apiUrl = process.env.ARBO_API_URL || "http://localhost:4000/api";
        const hasKey = !!process.env.ARBO_API_KEY;
        const ok = await arbo.ping();
        return {
            content: [{
                type: "text" as const,
                text: JSON.stringify({
                    connected: ok, apiUrl, apiKeyConfigured: hasKey,
                    apiKeyPrefix: hasKey ? process.env.ARBO_API_KEY!.slice(0, 10) + "..." : "NOT SET",
                }, null, 2),
            }],
        };
    },
);

// ═══════════════════════════════════════════════════════════════════
//  TRANSPORT — stdio (local) or SSE/HTTP (Render/cloud)
// ═══════════════════════════════════════════════════════════════════

async function startSse(port: number) {
    const app = express();
    app.use(express.json());

    const transports = new Map<string, SSEServerTransport>();

    app.get("/sse", async (req, res) => {
        const transport = new SSEServerTransport("/messages", res);
        transports.set(transport.sessionId, transport);
        res.on("close", () => transports.delete(transport.sessionId));
        await server.connect(transport);
    });

    app.post("/messages", async (req, res) => {
        const sessionId = req.query.sessionId as string;
        const transport = transports.get(sessionId);
        if (!transport) { res.status(404).send("Session not found"); return; }
        await transport.handlePostMessage(req, res);
    });

    app.get("/health", (_req, res) => res.json({ status: "ok", server: "arbo-forms-mcp" }));

    app.listen(port, () => {
        console.log(`Arbo Forms MCP server (SSE) running on port ${port}`);
        console.log(`  SSE endpoint: http://0.0.0.0:${port}/sse`);
    });
}

async function startStdio() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Arbo Forms MCP server running on stdio");
}

const PORT = process.env.PORT ? Number(process.env.PORT) : null;

if (PORT) {
    startSse(PORT).catch((err) => { console.error("Fatal:", err); process.exit(1); });
} else {
    startStdio().catch((err) => { console.error("Fatal:", err); process.exit(1); });
}
