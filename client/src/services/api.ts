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

async function downloadFile(path: string, fallbackName: string): Promise<void> {
    const res = await fetch(`${API_URL}${path}`, { headers: headers() });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
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
        throw new Error(data.errors?.[0]?.msg || data.msg || `Request failed (${res.status})`);
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
    submitResponse: (
        id: number,
        answers: Record<string, any>,
        respondentInfo?: { respondentName?: string; respondentEmail?: string; respondentData?: Record<string, any> }
    ) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}/responses`, {
            method: "POST",
            headers: headers(false),
            body: JSON.stringify({ answers, ...respondentInfo }),
        }),

    getResponses: (id: number) =>
        request<{ ok: boolean; data: any[] }>(`/forms/${id}/responses`, {
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

    analyzeResponses: (id: number, prompt?: string) =>
        request<{ ok: boolean; data: any }>(`/forms/${id}/analyze`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ prompt }),
        }),

    aiChat: (messages: { role: string; content: string }[], currentSchema: any) =>
        request<{ ok: boolean; data: any }>("/forms/ai/chat", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ messages, currentSchema }),
        }),
};

export const projectApi = {
    create: (body: { name: string; description?: string; color?: string }) =>
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

    delete: (id: number) =>
        request<{ ok: boolean }>(`/projects/${id}`, {
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
};

export interface OpenRouterSettings {
    hasApiKey: boolean;
    apiKeyMasked: string | null;
    model: string;
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

export const settingsApi = {
    getOpenRouter: () =>
        request<{ ok: boolean; data: OpenRouterSettings }>("/settings/openrouter", {
            headers: headers(),
        }),

    updateOpenRouter: (body: { apiKey?: string; model?: string }) =>
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
        request<{ ok: boolean; data: { id: string; name: string; contextLength: number; description: string }[] }>(
            "/settings/openrouter/models",
            { headers: headers() },
        ),
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
