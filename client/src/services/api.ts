const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const getToken = () => localStorage.getItem("token");

const headers = (withAuth = true): HeadersInit => {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (withAuth) {
        const token = getToken();
        if (token) h["Authorization"] = `Bearer ${token}`;
    }
    return h;
};

async function downloadFile(path: string, fallbackName: string, method: "GET" | "POST" = "GET", body?: object): Promise<void> {
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: headers(),
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.errors?.[0]?.msg || `Export failed (${res.status})`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="?(.+?)"?$/);
    const filename = match?.[1] || fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, options);
    } catch {
        throw new Error("Cannot connect to server. Make sure the backend is running.");
    }

    let data: any;
    try {
        data = await res.json();
    } catch {
        throw new Error(`Server error (${res.status})`);
    }

    if (!res.ok) {
        throw new Error(data.errors?.[0]?.msg || data.msg || data.error || `Request failed (${res.status})`);
    }
    return data;
}

export const authApi = {
    login: (body: { email: string; password: string }) =>
        request<{ ok: boolean; token: string }>("/auth/login", {
            method: "POST",
            headers: headers(false),
            body: JSON.stringify(body),
        }),

    register: (body: { name: string; email: string; password: string }) =>
        request<{ ok: boolean; token: string }>("/auth/register", {
            method: "POST",
            headers: headers(false),
            body: JSON.stringify(body),
        }),

    google: (credential: string) =>
        request<{ ok: boolean; token: string }>("/auth/google", {
            method: "POST",
            headers: headers(false),
            body: JSON.stringify({ credential }),
        }),

    profile: () =>
        request<{ msg: any }>("/auth/profile", { headers: headers() }),
};

// A link to a related ("child") form, carrying a signed ref back to the parent response.
export interface ChildFormLink {
    formId: number;
    title: string;
    slug: string;
    url: string;
}

// Relation cardinality between two forms.
export type RelationType = "one_to_one" | "one_to_many" | "many_to_many" | "zero_to_many" | "one_to_zero";

// AI-generated relational schema
export interface AIGeneratedField {
    name: string;
    label: string;
    type: string;
    componentType: string;
    required: boolean;
    unique?: boolean;
    defaultValue?: string;
    validations?: string[];
    pattern?: string;
    patternMessage?: string;
    options: string[];
}
export type FormAccessMode = "owner" | "authed" | "public";
export interface AIGeneratedForm {
    title: string;
    description: string;
    accessMode?: FormAccessMode;
    allowMultiple?: boolean;
    fields: AIGeneratedField[];
}
export interface AIGeneratedRelation {
    parentForm: string;
    childForm: string;
    type: RelationType;
    fkLabelField?: string;
}
export interface AIGeneratedSchema {
    forms: AIGeneratedForm[];
    relations: AIGeneratedRelation[];
}

// A persisted relation between two forms of a project.
export interface FormRelation {
    id?: number;
    projectId?: number;
    parentFormId: number;
    childFormId: number;
    keyField?: string | null;
    type?: RelationType;
    joinFormId?: number | null;
}

export const formApi = {
    create: (body: any) =>
        request<{ ok: boolean; data: any }>("/forms", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    getMyForms: () =>
        request<{ ok: boolean; data: any[] }>("/forms", { headers: headers() }),

    getArchivedForms: () =>
        request<{ ok: boolean; data: any[] }>("/forms/archived", { headers: headers() }),

    getTrashedForms: () =>
        request<{ ok: boolean; data: any[] }>("/forms/trash", { headers: headers() }),

    getSharedForms: () =>
        request<{ ok: boolean; data: any[] }>("/forms/shared", { headers: headers() }),

    getById: (id: number) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}`, { headers: headers() }),

    getBySlug: (slug: string) =>
        request<{ ok: boolean; data: any }>(`/forms/slug/${slug}`, {
            headers: headers(false),
        }),

    // Another form's records as { value, label } options for a foreign-key field.
    getOptions: (id: number, labelField?: string) =>
        request<{ ok: boolean; data: { value: string; label: string }[] }>(
            `/forms/${id}/options${labelField ? `?labelField=${encodeURIComponent(labelField)}` : ""}`,
            { headers: headers(false) }
        ),

    update: (id: number, body: any) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    // Soft delete (move to trash)
    delete: (id: number) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}`, {
            method: "DELETE",
            headers: headers(),
        }),

    // Restore from trash
    restore: (id: number) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}/restore`, {
            method: "POST",
            headers: headers(),
        }),

    // Permanent delete
    permanentDelete: (id: number) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}/permanent`, {
            method: "DELETE",
            headers: headers(),
        }),

    // Archive / Unarchive
    archive: (id: number) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}/archive`, {
            method: "POST",
            headers: headers(),
        }),

    unarchive: (id: number) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}/unarchive`, {
            method: "POST",
            headers: headers(),
        }),

    // Collaborators
    getCollaborators: (formId: number) =>
        request<{ ok: boolean; data: any[] }>(`/forms/${formId}/collaborators`, {
            headers: headers(),
        }),

    addCollaborator: (formId: number, email: string, role: string = "viewer") =>
        request<{ ok: boolean; data: any }>(`/forms/${formId}/collaborators`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ email, role }),
        }),

    removeCollaborator: (formId: number, email: string) =>
        request<{ ok: boolean; data: any }>(`/forms/${formId}/collaborators/${encodeURIComponent(email)}`, {
            method: "DELETE",
            headers: headers(),
        }),

    updateCollaboratorRole: (formId: number, email: string, role: string) =>
        request<{ ok: boolean; data: any }>(`/forms/${formId}/collaborators/${encodeURIComponent(email)}`, {
            method: "PATCH",
            headers: headers(),
            body: JSON.stringify({ role }),
        }),

    // Responses
    checkMyResponse: (id: number, ref?: string) =>
        request<{ ok: boolean; data: { hasResponded: boolean } }>(
            `/forms/${id}/responses/mine${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`,
            { headers: headers() },
        ),

    getResponseCount: (id: number) =>
        request<{ ok: boolean; data: { count: number } }>(
            `/forms/${id}/responses/count`,
            { headers: headers() },
        ),

    nullifyResponseFields: (id: number, fieldNames: string[]) =>
        request<{ ok: boolean; data: { updated: number } }>(
            `/forms/${id}/responses/nullify-fields`,
            { method: "PATCH", headers: headers(), body: JSON.stringify({ fieldNames }) },
        ),

    submitResponse: (
        id: number,
        answers: Record<string, any>,
        respondentInfo?: { respondentName?: string; respondentEmail?: string; respondentData?: Record<string, any> },
        ref?: string,
        ref2?: string
    ) =>
        // headers() sends the auth token when present (identifies a logged-in / Google respondent),
        // and simply omits it for anonymous submissions.
        request<{ ok: boolean; data: any; childForms?: ChildFormLink[] }>(`/forms/${id}/responses`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ answers, ...respondentInfo, ...(ref ? { ref } : {}), ...(ref2 ? { ref2 } : {}) }),
        }),

    getResponses: (id: number) =>
        request<{ ok: boolean; data: any[] }>(`/forms/${id}/responses`, {
            headers: headers(),
        }),

    getResponseChain: (id: number) =>
        request<{ ok: boolean; data: { forms: Record<string, any>; parents: Record<string, any>; tree: any[] } }>(`/forms/${id}/responses/chain`, {
            headers: headers(),
        }),

    // Shareable ?ref= links into each child form for one specific response (chained to it).
    getChildLinks: (formId: number, responseId: number) =>
        request<{ ok: boolean; data: ChildFormLink[] }>(`/forms/${formId}/responses/${responseId}/child-links`, {
            headers: headers(),
        }),


    deleteResponse: (formId: number, responseId: number) =>
        request<{ ok: boolean; data: any }>(`/forms/${formId}/responses/${responseId}`, {
            method: "DELETE",
            headers: headers(),
        }),

    exportExcel: (id: number) =>
        downloadFile(`/forms/${id}/export/excel`, `responses_${id}.xlsx`),

    exportPdf: (id: number) =>
        downloadFile(`/forms/${id}/export/pdf`, `responses_${id}.pdf`),

    exportResponsePdf: (formId: number, responseId: number) =>
        downloadFile(`/forms/${formId}/responses/${responseId}/export/pdf`, `respuesta_${responseId}.pdf`),

    previewResponsePdf: async (formId: number, responseId: number, design: any) => {
        // Open the tab synchronously (within the click gesture) to avoid popup blocking
        const win = window.open("", "_blank");
        try {
            const res = await fetch(`${API_URL}/forms/${formId}/responses/${responseId}/preview-pdf`, {
                method: "POST",
                headers: headers(),
                body: JSON.stringify({ design }),
            });
            if (!res.ok) throw new Error(`Preview failed (${res.status})`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            if (win) win.location.href = url;
            else window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e) {
            if (win) win.close();
            throw e;
        }
    },

    savePdfLayout: (formId: number, layout: any) =>
        request<{ ok: boolean; data: any }>(`/forms/${formId}/pdf-layout`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify({ layout }),
        }),

    saveDashboardLayout: (formId: number, layout: any) =>
        request<{ ok: boolean; data: any }>(`/forms/${formId}/dashboard-layout`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify({ layout }),
        }),

    patchStyles: (formId: number, patch: Record<string, any>) =>
        request<{ ok: boolean; data: any }>(`/forms/${formId}/styles`, {
            method: "PATCH",
            headers: headers(),
            body: JSON.stringify(patch),
        }),

    analyzeResponses: (id: number, prompt?: string) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}/analyze`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ prompt }),
        }),

    generateDashboard: (id: number, prompt?: string, design?: any) =>
        downloadFile(`/forms/${id}/generate-dashboard`, `dashboard-form-${id}.html`, "POST",
            (prompt || design) ? { ...(prompt ? { prompt } : {}), ...(design ? { design } : {}) } : undefined),

    generatePowerBi: (id: number, diagnostic = false) =>
        downloadFile(`/forms/${id}/generate-powerbi${diagnostic ? "?diagnostic=true" : ""}`, `form-${id}-powerbi${diagnostic ? "-diag" : ""}.zip`, "POST"),

    aiChat: (messages: { role: string; content: string }[], currentSchema: any) =>
        request<{ ok: boolean; data: any }>("/forms/ai/chat", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ messages, currentSchema }),
        }),

    aiScan: (image: string) =>
        request<{ ok: boolean; data: any }>("/forms/ai/scan", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ image }),
        }),
};

// --- Composite component library (bloques de campos con lógica) ---
export interface FieldBlockDto {
    id: number;
    name: string;
    description: string | null;
    fields: any[];
    isPublic: boolean;
    sourceId: number | null;
    userId: number;
    user?: { name?: string; email?: string };
}

export const blockApi = {
    getMine: () =>
        request<{ ok: boolean; data: FieldBlockDto[] }>("/blocks", { headers: headers() }),

    getPublic: () =>
        request<{ ok: boolean; data: FieldBlockDto[] }>("/blocks/public", { headers: headers() }),

    create: (body: { name: string; description?: string; fields: any[]; isPublic?: boolean }) =>
        request<{ ok: boolean; data: FieldBlockDto }>("/blocks", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    update: (id: number, body: Partial<{ name: string; description: string; fields: any[]; isPublic: boolean }>) =>
        request<{ ok: boolean; data: FieldBlockDto }>(`/blocks/${id}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    remove: (id: number) =>
        request<{ ok: boolean }>(`/blocks/${id}`, { method: "DELETE", headers: headers() }),

    addPublic: (id: number) =>
        request<{ ok: boolean; data: FieldBlockDto }>(`/blocks/${id}/add`, { method: "POST", headers: headers() }),
};

export const projectApi = {
    create: (body: { name: string; description?: string; color?: string; isDatabase?: boolean }) =>
        request<{ ok: boolean; data: any }>("/projects", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    getAll: () =>
        request<{ ok: boolean; data: { owned: any[]; shared: any[] } }>("/projects", {
            headers: headers(),
        }),

    getById: (id: number) =>
        request<{ ok: boolean; data: any }>(`/projects/${id}`, {
            headers: headers(),
        }),

    update: (id: number, body: { name?: string; description?: string; color?: string }) =>
        request<{ ok: boolean; data: any }>(`/projects/${id}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    delete: (id: number, deleteForms = false) =>
        request<{ ok: boolean }>(`/projects/${id}${deleteForms ? "?deleteForms=true" : ""}`, {
            method: "DELETE",
            headers: headers(),
        }),

    getCollaborators: (projectId: number) =>
        request<{ ok: boolean; data: any[] }>(`/projects/${projectId}/collaborators`, {
            headers: headers(),
        }),

    addCollaborator: (projectId: number, email: string, role: string = "viewer") =>
        request<{ ok: boolean; data: any }>(`/projects/${projectId}/collaborators`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ email, role }),
        }),

    removeCollaborator: (projectId: number, email: string) =>
        request<{ ok: boolean }>(`/projects/${projectId}/collaborators/${encodeURIComponent(email)}`, {
            method: "DELETE",
            headers: headers(),
        }),

    updateCollaboratorRole: (projectId: number, email: string, role: string) =>
        request<{ ok: boolean; data: any }>(`/projects/${projectId}/collaborators/${encodeURIComponent(email)}`, {
            method: "PATCH",
            headers: headers(),
            body: JSON.stringify({ role }),
        }),

    assignForm: (formId: number, projectId: number | null) =>
        request<{ ok: boolean }>("/projects/assign-form", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ formId, projectId }),
        }),

    getRelations: (projectId: number) =>
        request<{ ok: boolean; data: FormRelation[] }>(`/projects/${projectId}/relations`, {
            headers: headers(),
        }),

    saveRelations: (projectId: number, relations: FormRelation[]) =>
        request<{ ok: boolean; data: FormRelation[] }>(`/projects/${projectId}/relations`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify({ relations }),
        }),

    generateSchema: (projectId: number, description: string) =>
        request<{ ok: boolean; data: AIGeneratedSchema }>(`/projects/${projectId}/ai/generate-schema`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ description }),
        }),
};

export interface OpenRouterSettings {
    hasApiKey: boolean;
    apiKeyMasked: string | null;
    model: string;
    visionModel: string;
}

export interface OpenRouterUsage {
    label: string;
    usage: number;
    limit: number | null;
    is_free_tier: boolean;
    rate_limit: { requests: number; interval: string };
    daily: {
        used: number;
        remaining: number;
        limit: number;
        resetAt: string;
        date: string;
    };
}

export interface AIProviderInfo {
    id: string;
    label: string;
    keyHint: string;
    docsUrl: string;
    defaultModel: string;
    hasApiKey: boolean;
    apiKeyMasked: string | null;
    model: string;
    enabled: boolean;
    dailyLimit: number;
    usage: {
        used: number;
        remaining: number;
        lastUsedAt: string | null;
        lastModel: string | null;
        lastError: string | null;
        exhausted: boolean;
        exhaustedUntil: string | null;
    };
}

export interface AIProvidersData {
    providers: AIProviderInfo[];
    date: string;
    resetAt: string;
}

export const settingsApi = {
    getOpenRouter: () =>
        request<{ ok: boolean; data: OpenRouterSettings }>("/settings/openrouter", {
            headers: headers(),
        }),

    updateOpenRouter: (body: { apiKey?: string; model?: string; visionModel?: string }) =>
        request<{ ok: boolean; msg: string }>("/settings/openrouter", {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    getOpenRouterUsage: () =>
        request<{ ok: boolean; data: OpenRouterUsage }>("/settings/openrouter/usage", {
            headers: headers(),
        }),

    getOpenRouterModels: () =>
        request<{ ok: boolean; data: { id: string; name: string; contextLength: number; description: string; vision: boolean }[] }>(
            "/settings/openrouter/models",
            { headers: headers() },
        ),

    getAIProviders: () =>
        request<{ ok: boolean; data: AIProvidersData }>("/settings/ai-providers", {
            headers: headers(),
        }),

    updateAIProvider: (id: string, body: { apiKey?: string; model?: string; enabled?: boolean; dailyLimit?: number }) =>
        request<{ ok: boolean; msg: string }>(`/settings/ai-providers/${id}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    updateAIProviderOrder: (order: string[]) =>
        request<{ ok: boolean; msg: string }>("/settings/ai-providers/order", {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify({ order }),
        }),

    getEmbedding: () =>
        request<{ ok: boolean; data: { hasApiKey: boolean; apiKeyMasked: string | null; model: string; usingEnvKey: boolean } }>(
            "/settings/embedding",
            { headers: headers() },
        ),

    updateEmbedding: (body: { apiKey?: string; model?: string }) =>
        request<{ ok: boolean; msg: string }>("/settings/embedding", {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(body),
        }),

    getQdrant: () =>
        request<{ ok: boolean; data: { url: string; hasApiKey: boolean; apiKeyMasked: string | null; usingEnvConfig: boolean } }>(
            "/settings/qdrant",
            { headers: headers() },
        ),

    updateQdrant: (body: { url?: string; apiKey?: string }) =>
        request<{ ok: boolean; msg: string }>("/settings/qdrant", {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(body),
        }),
};

export const ragApi = {
    buildForm: (formId: number) =>
        request<{ ok: boolean; data: { indexed: number } }>(`/rag/forms/${formId}/build`, {
            method: "POST",
            headers: headers(),
        }),

    buildProject: (projectId: number) =>
        request<{ ok: boolean; data: { indexed: number } }>(`/rag/projects/${projectId}/build`, {
            method: "POST",
            headers: headers(),
        }),

    queryForm: (formId: number, query: string) =>
        request<{ ok: boolean; data: { answer: string; sources: { textSnippet: string; score: number }[] } }>(
            `/rag/forms/${formId}/query`,
            { method: "POST", headers: headers(), body: JSON.stringify({ query }) },
        ),

    queryProject: (projectId: number, query: string) =>
        request<{ ok: boolean; data: { answer: string; sources: { textSnippet: string; score: number }[] } }>(
            `/rag/projects/${projectId}/query`,
            { method: "POST", headers: headers(), body: JSON.stringify({ query }) },
        ),

    getFormStatus: (formId: number) =>
        request<{ ok: boolean; data: { ragStatus: string; ragCollectionId: string | null } }>(
            `/rag/forms/${formId}/status`,
            { headers: headers() },
        ),

    getProjectStatus: (projectId: number) =>
        request<{ ok: boolean; data: { ragStatus: string; ragCollectionId: string | null } }>(
            `/rag/projects/${projectId}/status`,
            { headers: headers() },
        ),

    buildUser: () =>
        request<{ ok: boolean; data: { indexed: number } }>("/rag/user/build", {
            method: "POST",
            headers: headers(),
        }),

    queryUser: (query: string) =>
        request<{ ok: boolean; data: { answer: string; sources: { textSnippet: string; score: number }[] } }>(
            "/rag/user/query",
            { method: "POST", headers: headers(), body: JSON.stringify({ query }) },
        ),

    getUserStatus: () =>
        request<{ ok: boolean; data: { ragStatus: string; ragCollectionId: string | null } }>(
            "/rag/user/status",
            { headers: headers() },
        ),
};

export const agentApi = {
    chat: (messages: { role: "user" | "assistant"; content: string }[]) =>
        request<{ ok: boolean; data: { reply: string } }>("/agent/chat", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ messages }),
        }),
};

export const apiKeyApi = {
    create: (name: string) =>
        request<{ ok: boolean; data: { id: number; key: string; name: string; createdAt: string } }>("/api-keys", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ name }),
        }),

    list: () =>
        request<{ ok: boolean; data: any[] }>("/api-keys", { headers: headers() }),

    revoke: (keyId: number) =>
        request<{ ok: boolean }>(`/api-keys/${keyId}/revoke`, {
            method: "PATCH",
            headers: headers(),
        }),

    delete: (keyId: number) =>
        request<{ ok: boolean }>(`/api-keys/${keyId}`, {
            method: "DELETE",
            headers: headers(),
        }),
};
