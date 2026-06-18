/**
 * AI Agent Service — agentic loop with tool calling via OpenRouter.
 *
 * The AI can invoke tools to read data from Arbo (forms, responses, projects)
 * before producing its final response. Tools call repositories directly.
 */

import FormResponse from "../models/FormResponse.model.js";
import FormField from "../models/FormField.model.js";
import { getFormsByUserId, getFormById } from "../repositories/form.repository.js";
import { getUserProjects } from "../repositories/project.repository.js";
import { callAI, type AIMessage } from "../utils/ai-call.js";

// ─── Tool definitions (OpenAI function-calling format) ───────────────────────

const TOOLS = [
    {
        type: "function",
        function: {
            name: "list_forms",
            description: "Lista todos los formularios del usuario con título, ID, slug y estado de publicación.",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
    {
        type: "function",
        function: {
            name: "get_form_schema",
            description: "Devuelve la estructura de campos de un formulario específico.",
            parameters: {
                type: "object",
                properties: {
                    formId: { type: "number", description: "ID del formulario" },
                },
                required: ["formId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_form_responses",
            description: "Devuelve estadísticas y respuestas recientes de un formulario.",
            parameters: {
                type: "object",
                properties: {
                    formId: { type: "number", description: "ID del formulario" },
                    limit: { type: "number", description: "Máximo de respuestas individuales a incluir (default 20)" },
                },
                required: ["formId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "search_responses",
            description: "Busca respuestas que contengan cierto texto en un campo específico.",
            parameters: {
                type: "object",
                properties: {
                    formId: { type: "number", description: "ID del formulario" },
                    fieldName: { type: "string", description: "Nombre del campo (snake_case)" },
                    query: { type: "string", description: "Texto a buscar" },
                },
                required: ["formId", "fieldName", "query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "list_projects",
            description: "Lista los proyectos del usuario con sus formularios asociados.",
            parameters: { type: "object", properties: {}, required: [] },
        },
    },
];

// ─── Tool executors ───────────────────────────────────────────────────────────

async function toolListForms(userId: number) {
    const forms = await getFormsByUserId(userId);
    return forms.map((f) => ({
        id: f.id,
        title: f.title,
        slug: f.slug,
        published: f.isPublished,
        fieldCount: (f as any).fields?.length ?? 0,
        projectId: f.projectId ?? null,
    }));
}

async function toolGetFormSchema(formId: number, userId: number) {
    const form = await getFormById(formId);
    if (!form || form.userId !== userId) throw new Error(`Formulario ${formId} no encontrado`);
    return {
        id: form.id,
        title: form.title,
        description: form.description,
        fields: ((form as any).fields ?? []).map((f: any) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            componentType: f.componentType,
            required: f.required,
            options: f.options ?? [],
        })),
    };
}

async function toolGetFormResponses(formId: number, userId: number, limit = 20) {
    const form = await getFormById(formId);
    if (!form || form.userId !== userId) throw new Error(`Formulario ${formId} no encontrado`);

    const fields = await FormField.findAll({
        where: { formId },
        order: [["sortOrder", "ASC"]],
    });
    const responses = await FormResponse.findAll({
        where: { formId },
        order: [["createdAt", "DESC"]],
    });

    const dataFields = fields.filter((f) => !f.name.startsWith("__page_break_"));

    // Per-field stats
    const fieldStats = dataFields.map((f) => {
        const values = responses
            .map((r) => (r.answers as any)?.[f.name])
            .filter((v) => v != null && v !== "");
        const freq: Record<string, number> = {};
        for (const v of values) { const k = String(v); freq[k] = (freq[k] || 0) + 1; }
        return {
            field: f.label || f.name,
            filled: values.length,
            total: responses.length,
            completionRate: `${Math.round((values.length / (responses.length || 1)) * 100)}%`,
            topValues: Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5)
                .map(([v, c]) => `"${v}" ×${c}`),
        };
    });

    // Individual rows (limited)
    const rows = responses.slice(0, limit).map((r) => ({
        id: r.id,
        respondent: r.respondentName || r.respondentEmail || "Anónimo",
        date: r.createdAt,
        answers: dataFields.reduce((acc, f) => {
            acc[f.label || f.name] = (r.answers as any)?.[f.name] ?? null;
            return acc;
        }, {} as Record<string, any>),
    }));

    return {
        form: { id: form.id, title: form.title },
        total: responses.length,
        fieldStats,
        rows,
    };
}

async function toolSearchResponses(formId: number, userId: number, fieldName: string, query: string) {
    const form = await getFormById(formId);
    if (!form || form.userId !== userId) throw new Error(`Formulario ${formId} no encontrado`);

    const responses = await FormResponse.findAll({ where: { formId } });
    const matched = responses.filter((r) => {
        const val = (r.answers as any)?.[fieldName];
        return val != null && String(val).toLowerCase().includes(query.toLowerCase());
    });

    return {
        formTitle: form.title,
        field: fieldName,
        query,
        matched: matched.length,
        rows: matched.slice(0, 30).map((r) => ({
            id: r.id,
            respondent: r.respondentName || r.respondentEmail || "Anónimo",
            value: (r.answers as any)?.[fieldName],
            date: r.createdAt,
        })),
    };
}

async function toolListProjects(userId: number, email: string) {
    const projects = await getUserProjects(userId, email);
    const list: any[] = Array.isArray(projects) ? projects : (projects as any).owned ?? [];
    return list.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        color: p.color ?? null,
        forms: (p.forms ?? []).map((f: any) => ({ id: f.id, title: f.title })),
    }));
}

async function executeTool(name: string, args: any, userId: number, email: string): Promise<any> {
    switch (name) {
        case "list_forms":         return toolListForms(userId);
        case "get_form_schema":    return toolGetFormSchema(args.formId, userId);
        case "get_form_responses": return toolGetFormResponses(args.formId, userId, args.limit);
        case "search_responses":   return toolSearchResponses(args.formId, userId, args.fieldName, args.query);
        case "list_projects":      return toolListProjects(userId, email);
        default: throw new Error(`Tool desconocida: ${name}`);
    }
}

// ─── Public interface ─────────────────────────────────────────────────────────

export interface AgentMessage {
    role: "user" | "assistant";
    content: string;
}

const SYSTEM_PROMPT = `Sos el asistente de Arbo Forms. Tenés acceso a herramientas para consultar los formularios, respuestas y proyectos del usuario.

Cuando el usuario pregunte sobre datos (formularios, respuestas, estadísticas), usá las herramientas para obtener información real antes de responder.
Respondé siempre en español, de forma concisa y útil.
Si necesitás saber el ID de un formulario, usá primero list_forms para listarlos.`;

export async function runAgent(
    history: AgentMessage[],
    userId: number,
    email: string,
): Promise<string> {
    const messages: AIMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    const MAX_ITERATIONS = 6;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        // callAI uses the configured provider (user key → env key → failover)
        const result = await callAI(messages, { tools: TOOLS, temperature: 0.4, userId });

        // No tool calls → final answer
        if (!result.tool_calls?.length) {
            return result.content;
        }

        // Add assistant turn with tool_calls
        messages.push({ role: "assistant", content: result.content } as any);
        // Patch tool_calls onto last message (callAI doesn't expose raw message)
        (messages[messages.length - 1] as any).tool_calls = result.tool_calls;

        // Execute tools and add results
        for (const tc of result.tool_calls) {
            let toolResult: any;
            try {
                const args = JSON.parse(tc.function.arguments || "{}");
                toolResult = await executeTool(tc.function.name, args, userId, email);
            } catch (err: any) {
                toolResult = { error: err.message };
            }
            messages.push({
                role: "tool" as any,
                content: JSON.stringify(toolResult),
                ...(tc.id ? { tool_call_id: tc.id } : {}),
                ...(tc.function.name ? { name: tc.function.name } : {}),
            } as any);
        }
    }

    throw new Error("El agente alcanzó el límite de iteraciones sin respuesta final.");
}
