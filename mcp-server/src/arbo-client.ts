/**
 * HTTP client that talks to the Arbo Forms backend using an API key.
 *
 * Env vars:
 *   ARBO_API_URL   — backend URL (default: http://localhost:4000/api)
 *   ARBO_API_KEY   — your API key (created in the Arbo app under /form-builder/api-keys)
 */

const API_URL = process.env.ARBO_API_URL || "http://localhost:4000/api";
const API_KEY = process.env.ARBO_API_KEY || "";

const hdrs = (): Record<string, string> => ({
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
});

async function req<T>(method: string, path: string, body?: any): Promise<T> {
    if (!API_KEY) throw new Error("ARBO_API_KEY not set. Create one in /form-builder/api-keys");

    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: hdrs(),
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(`API ${res.status}: ${(data as any).error || (data as any).errors?.[0]?.msg || res.statusText}`);
    }
    return res.json() as Promise<T>;
}

// ─── Types ───

export interface FormSummary {
    id: number;
    title: string;
    slug: string;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    fields: { name: string; label: string; type: string; componentType: string }[];
}

export interface FormDataResponse {
    form: { id: number; title: string; slug: string };
    columns: { name: string; label?: string; type: string }[];
    rows: Record<string, any>[];
    total: number;
}

export interface CreateFormInput {
    title: string;
    description?: string;
    onSubmit?: string;
    fields: {
        name: string;
        label: string;
        type: string;
        componentType: string;
        placeholder?: string;
        required?: boolean;
        options?: string[];
        sortOrder?: number;
        page?: number;
        validations?: string[];
    }[];
    styles?: Record<string, any>;
    projectId?: number | null;
}

export interface OpenRouterConfig {
    apiKey: string;
    model: string;
}

// ─── Read API ───

export const listForms = () => req<FormSummary[]>("GET", "/api-keys/data/forms");

export const getOpenRouterConfig = () =>
    req<OpenRouterConfig>("GET", "/settings/openrouter/key").then((r: any) => r.data as OpenRouterConfig);

export const getFormData = (formId: number) =>
    req<FormDataResponse>("GET", `/api-keys/data/forms/${formId}`);

export const ping = async (): Promise<boolean> => {
    try { await listForms(); return true; } catch { return false; }
};

// ─── Write API ───

export const createForm = (input: CreateFormInput) =>
    req<any>("POST", "/api-keys/data/forms", input);

export const updateForm = (formId: number, input: Partial<CreateFormInput>) =>
    req<any>("PUT", `/api-keys/data/forms/${formId}`, input);

export const publishForm = (formId: number, published: boolean) =>
    req<any>("PATCH", `/api-keys/data/forms/${formId}/publish`, { published });

export const deleteForm = (formId: number) =>
    req<any>("DELETE", `/api-keys/data/forms/${formId}`);
