import UserForm from "../models/UserForm.model";
import Project from "../models/Project.model";
import User from "../models/User.model";
import FormField from "../models/FormField.model";
import FormResponse from "../models/FormResponse.model";
import { getQdrantClient, getEmbeddingConfig, type EmbeddingConfig } from "../config/qdrant";
import { callAI } from "../utils/ai-call";

const VECTOR_SIZE = 768;

// ─── Embedding ──────────────────────────────────────────────────────────────

async function generateEmbedding(text: string, config: EmbeddingConfig): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:embedContent?key=${config.apiKey}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: `models/${config.model}`,
            content: { parts: [{ text }] },
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(`Embedding API error: ${err?.error?.message || res.status}`);
    }
    const data = await res.json() as any;
    return data.embedding.values as number[];
}

// ─── Text builders ──────────────────────────────────────────────────────────

function responseToText(answers: Record<string, any>, fields: any[]): string {
    return fields
        .filter((f: any) => !f.name?.startsWith("__page_break_"))
        .map((f: any) => {
            const val = answers?.[f.name];
            if (val === null || val === undefined || val === "") return null;
            return `${f.label}: ${Array.isArray(val) ? val.join(", ") : String(val)}`;
        })
        .filter(Boolean)
        .join(" | ");
}

function chainToText(
    node: any,
    formsMap: Map<number, { title: string; fields: any[] }>,
    depth = 0,
): string {
    const meta = formsMap.get(node.formId);
    if (!meta) return "";
    const indent = "  ".repeat(depth);
    const fieldText = responseToText(node.answers || {}, meta.fields);
    let text = `${indent}${meta.title}: ${fieldText}`;
    for (const child of node.children || []) {
        const childText = chainToText(child, formsMap, depth + 1);
        if (childText) text += "\n" + childText;
    }
    return text;
}

// ─── Qdrant helpers ─────────────────────────────────────────────────────────

async function ensureCollection(client: any, name: string): Promise<void> {
    const existing = await client.getCollections();
    if (existing.collections.some((c: any) => c.name === name)) {
        await client.deleteCollection(name);
    }
    await client.createCollection(name, {
        vectors: { size: VECTOR_SIZE, distance: "Cosine" },
    });
}

// ─── Build: standalone form ─────────────────────────────────────────────────

export async function buildFormRAG(formId: number, userConfig: any): Promise<{ indexed: number }> {
    const form = await UserForm.findByPk(formId, { include: [{ model: FormField }] });
    if (!form) throw new Error("Formulario no encontrado");

    const responses = await FormResponse.findAll({ where: { formId } });
    if (!responses.length) throw new Error("No hay respuestas para indexar");

    const fields = ((form as any).fields || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const embConfig = getEmbeddingConfig(userConfig?.embeddings);
    if (!embConfig.apiKey) throw new Error("No hay API key de embeddings configurada. Configurala en Ajustes → Embeddings o en la variable de entorno GEMINI_EMBEDDING_API_KEY.");

    const qdrant = getQdrantClient(userConfig?.qdrant);
    const collectionName = `arbo_form_${formId}`;
    await ensureCollection(qdrant, collectionName);

    const points: any[] = [];
    for (const resp of responses) {
        const r = resp.get({ plain: true });
        const text = `Formulario: ${form.title}\n${responseToText(r.answers || {}, fields)}`;
        if (text.trim().length < 5) continue;
        const vector = await generateEmbedding(text, embConfig);
        points.push({
            id: r.id,
            vector,
            payload: {
                responseId: r.id,
                formId,
                formTitle: form.title,
                respondentName: r.respondentName || null,
                respondentEmail: r.respondentEmail || null,
                createdAt: r.createdAt,
                textSnippet: text.slice(0, 500),
                answers: r.answers,
            },
        });
    }

    if (!points.length) throw new Error("No se pudieron generar puntos para indexar");
    await qdrant.upsert(collectionName, { wait: true, points });
    await form.update({ ragStatus: "ready", ragCollectionId: collectionName });

    return { indexed: points.length };
}

// ─── Build: project (standalone group OR relational database) ───────────────
//
// isDatabase=false → cada respuesta es un punto plano taggeado con su formulario
// isDatabase=true  → cada cadena raíz se indexa como JSON anidado

export async function buildProjectRAG(projectId: number, userConfig: any): Promise<{ indexed: number }> {
    const project = await Project.findByPk(projectId, {
        include: [{ model: UserForm, include: [{ model: FormField }] }],
    });
    if (!project) throw new Error("Proyecto no encontrado");

    const isDatabase: boolean = (project as any).isDatabase;
    const projectForms: any[] = (project as any).forms || [];
    if (!projectForms.length) throw new Error("El proyecto no tiene formularios");

    const formIds = projectForms.map((f: any) => f.id);
    const projectFormIdSet = new Set(formIds);

    const formsMap = new Map<number, { title: string; fields: any[] }>();
    for (const f of projectForms) {
        formsMap.set(f.id, {
            title: f.title,
            fields: (f.fields || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        });
    }

    const allResponses = await FormResponse.findAll({
        where: { formId: formIds },
        order: [["createdAt", "ASC"]],
    });
    if (!allResponses.length) throw new Error("No hay respuestas para indexar");

    const embConfig = getEmbeddingConfig(userConfig?.embeddings);
    if (!embConfig.apiKey) throw new Error("No hay API key de embeddings configurada. Configurala en Ajustes → Embeddings o en la variable de entorno GEMINI_EMBEDDING_API_KEY.");

    const qdrant = getQdrantClient(userConfig?.qdrant);
    const collectionName = `arbo_project_${projectId}`;
    await ensureCollection(qdrant, collectionName);

    const points: any[] = [];
    let pointId = 1;

    if (!isDatabase) {
        // ── Grupo de formularios sueltos: un punto plano por respuesta ──
        const allPlain = allResponses.map((r) => r.get({ plain: true }));
        for (const r of allPlain) {
            const meta = formsMap.get(r.formId);
            if (!meta) continue;
            const text = `Formulario: ${meta.title}\n${responseToText(r.answers || {}, meta.fields)}`;
            if (text.trim().length < 5) continue;
            const vector = await generateEmbedding(text, embConfig);
            points.push({
                id: pointId++,
                vector,
                payload: {
                    responseId: r.id,
                    formId: r.formId,
                    formTitle: meta.title,
                    projectId,
                    respondentName: r.respondentName || null,
                    respondentEmail: r.respondentEmail || null,
                    createdAt: r.createdAt,
                    textSnippet: text.slice(0, 500),
                    answers: r.answers,
                },
            });
        }
    } else {
        // ── BD relacional: un punto por cadena raíz (JSON anidado) ──
        const allPlain = allResponses.map((r) => r.get({ plain: true }));

        const childrenByParent = new Map<number, any[]>();
        for (const r of allPlain) {
            if (r.parentResponseId && projectFormIdSet.has(r.formId)) {
                const arr = childrenByParent.get(r.parentResponseId) || [];
                arr.push(r);
                childrenByParent.set(r.parentResponseId, arr);
            }
        }

        const addChildren = (node: any): any => ({
            ...node,
            children: (childrenByParent.get(node.id) || []).map(addChildren),
        });

        const rootResponses = allPlain
            .filter((r) => !r.parentResponseId || !projectFormIdSet.has(r.parentFormId))
            .map(addChildren);

        const buildPayloadChain = (node: any): any => ({
            formTitle: formsMap.get(node.formId)?.title,
            responseId: node.id,
            answers: node.answers,
            children: (node.children || []).map(buildPayloadChain),
        });

        for (const root of rootResponses) {
            const text = chainToText(root, formsMap);
            if (text.trim().length < 5) continue;
            const vector = await generateEmbedding(text, embConfig);
            points.push({
                id: pointId++,
                vector,
                payload: {
                    rootResponseId: root.id,
                    projectId,
                    textSnippet: text.slice(0, 800),
                    chain: buildPayloadChain(root),
                },
            });
        }
    }

    if (!points.length) throw new Error("No se generaron puntos para indexar");
    await qdrant.upsert(collectionName, { wait: true, points });
    await (project as any).update({ ragStatus: "ready", ragCollectionId: collectionName });

    return { indexed: points.length };
}

// ─── Query ───────────────────────────────────────────────────────────────────

export interface RAGQueryResult {
    answer: string;
    sources: { textSnippet: string; score: number }[];
}

async function ragSearch(
    collectionName: string,
    query: string,
    contextLabel: string,
    userConfig: any,
    userId?: number,
    limit = 6,
): Promise<RAGQueryResult> {
    const embConfig = getEmbeddingConfig(userConfig?.embeddings);
    if (!embConfig.apiKey) throw new Error("No hay API key de embeddings configurada");

    const qdrant = getQdrantClient(userConfig?.qdrant);
    const queryVector = await generateEmbedding(query, embConfig);

    const results: any[] = await qdrant.search(collectionName, {
        vector: queryVector,
        limit,
        with_payload: true,
    });

    if (!results.length) {
        return { answer: "No se encontraron respuestas relevantes en el índice RAG.", sources: [] };
    }

    const snippets = results.map((r: any) => r.payload?.textSnippet || "").filter(Boolean);
    const prompt = `Eres un analista de datos. Se te proveen fragmentos de respuestas relevantes recuperados por similitud semántica de ${contextLabel}.

FRAGMENTOS RELEVANTES:
${snippets.map((s, i) => `[${i + 1}] ${s}`).join("\n\n")}

CONSULTA DEL USUARIO: ${query}

Analizá los fragmentos y respondé de forma clara y estructurada en español neutro. Indicá si el contexto es insuficiente para responder con certeza. No inventes datos que no estén en los fragmentos.`;

    const { content } = await callAI(
        [{ role: "user", content: prompt }],
        { temperature: 0.3, max_tokens: 2000, userId },
    );

    return {
        answer: content,
        sources: results.map((r: any) => ({
            textSnippet: String(r.payload?.textSnippet || "").slice(0, 250),
            score: Math.round((r.score || 0) * 100) / 100,
        })),
    };
}

export async function queryFormRAG(
    formId: number,
    query: string,
    userConfig: any,
    userId?: number,
): Promise<RAGQueryResult> {
    const form = await UserForm.findByPk(formId);
    if (!form) throw new Error("Formulario no encontrado");
    if ((form as any).ragStatus === "none") throw new Error("El RAG no fue construido para este formulario. Hacé click en 'Crear RAG de análisis' primero.");
    const collectionName = (form as any).ragCollectionId || `arbo_form_${formId}`;
    return ragSearch(collectionName, query, `el formulario "${form.title}"`, userConfig, userId);
}

export async function queryProjectRAG(
    projectId: number,
    query: string,
    userConfig: any,
    userId?: number,
): Promise<RAGQueryResult> {
    const project = await Project.findByPk(projectId);
    if (!project) throw new Error("Proyecto no encontrado");
    if ((project as any).ragStatus === "none") throw new Error("El RAG no fue construido para este proyecto. Hacé click en 'Crear RAG de análisis' primero.");
    const collectionName = (project as any).ragCollectionId || `arbo_project_${projectId}`;
    return ragSearch(collectionName, query, `la base de datos relacional "${project.name}"`, userConfig, userId);
}

// ─── Status helpers ──────────────────────────────────────────────────────────

export async function getFormRAGStatus(formId: number) {
    const form = await UserForm.findByPk(formId, { attributes: ["id", "ragStatus", "ragCollectionId"] });
    if (!form) throw new Error("Formulario no encontrado");
    return { ragStatus: (form as any).ragStatus, ragCollectionId: (form as any).ragCollectionId };
}

export async function getProjectRAGStatus(projectId: number) {
    const project = await Project.findByPk(projectId, { attributes: ["id", "ragStatus", "ragCollectionId"] });
    if (!project) throw new Error("Proyecto no encontrado");
    return { ragStatus: (project as any).ragStatus, ragCollectionId: (project as any).ragCollectionId };
}

// ─── Build: user-level (all standalone forms — no database project) ──────────

export async function buildUserRAG(userId: number, userConfig: any): Promise<{ indexed: number }> {
    // Standalone forms = forms owned by this user with no project OR project that is NOT a database
    const forms = await UserForm.findAll({
        where: { userId, projectId: null },
        include: [{ model: FormField }],
    });
    if (!forms.length) throw new Error("No tenés formularios sueltos (sin proyecto) para indexar");

    const formIds = forms.map((f) => f.id);
    const responses = await FormResponse.findAll({
        where: { formId: formIds },
        order: [["createdAt", "ASC"]],
    });
    if (!responses.length) throw new Error("Tus formularios sueltos no tienen respuestas todavía");

    const formsMap = new Map<number, { title: string; fields: any[] }>();
    for (const f of forms) {
        formsMap.set(f.id, {
            title: f.title,
            fields: ((f as any).fields || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
        });
    }

    const embConfig = getEmbeddingConfig(userConfig?.embeddings);
    if (!embConfig.apiKey) throw new Error("No hay API key de embeddings configurada. Configurala en Ajustes → Embeddings o en GEMINI_EMBEDDING_API_KEY.");

    const qdrant = getQdrantClient(userConfig?.qdrant);
    const collectionName = `arbo_user_${userId}`;
    await ensureCollection(qdrant, collectionName);

    const points: any[] = [];
    let pointId = 1;

    for (const resp of responses) {
        const r = resp.get({ plain: true });
        const meta = formsMap.get(r.formId);
        if (!meta) continue;
        const text = `Formulario: ${meta.title}\n${responseToText(r.answers || {}, meta.fields)}`;
        if (text.trim().length < 5) continue;
        const vector = await generateEmbedding(text, embConfig);
        points.push({
            id: pointId++,
            vector,
            payload: {
                responseId: r.id,
                formId: r.formId,
                formTitle: meta.title,
                userId,
                respondentName: r.respondentName || null,
                respondentEmail: r.respondentEmail || null,
                createdAt: r.createdAt,
                textSnippet: text.slice(0, 500),
                answers: r.answers,
            },
        });
    }

    if (!points.length) throw new Error("No se generaron puntos para indexar");
    await qdrant.upsert(collectionName, { wait: true, points });
    await User.update(
        { standaloneRagStatus: "ready", standaloneRagCollectionId: collectionName },
        { where: { id: userId } },
    );

    return { indexed: points.length };
}

export async function queryUserRAG(userId: number, query: string, userConfig: any): Promise<RAGQueryResult> {
    const user = await User.findByPk(userId, { attributes: ["id", "standaloneRagStatus", "standaloneRagCollectionId"] });
    if (!user) throw new Error("Usuario no encontrado");
    if ((user as any).standaloneRagStatus === "none") throw new Error("El RAG del grupo no fue construido. Hacé click en 'Crear RAG del grupo' primero.");
    const collectionName = (user as any).standaloneRagCollectionId || `arbo_user_${userId}`;
    return ragSearch(collectionName, query, "el grupo de formularios sueltos", userConfig, userId);
}

export async function getUserRAGStatus(userId: number) {
    const user = await User.findByPk(userId, { attributes: ["id", "standaloneRagStatus", "standaloneRagCollectionId"] });
    if (!user) throw new Error("Usuario no encontrado");
    return {
        ragStatus: (user as any).standaloneRagStatus as string,
        ragCollectionId: (user as any).standaloneRagCollectionId as string | null,
    };
}
