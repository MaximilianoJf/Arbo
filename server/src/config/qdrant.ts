import { QdrantClient } from "@qdrant/js-client-rest";

export interface EmbeddingConfig {
    apiKey: string;
    model: string;
}

export function getQdrantClient(userQdrantConfig?: any): QdrantClient {
    const url = userQdrantConfig?.url || process.env.QDRANT_URL || "http://localhost:6333";
    const apiKey = userQdrantConfig?.apiKey || process.env.QDRANT_API_KEY;
    return new QdrantClient({ url, ...(apiKey ? { apiKey } : {}) });
}

// Embedding models currently available on the Generative Language API
// (v1beta embedContent). The older text-embedding-004 / embedding-001 were
// retired, so gemini-embedding-001 is the supported model. It defaults to
// 3072 dims but supports outputDimensionality:768 (Matryoshka) to match the
// hardcoded Qdrant collection size.
const VALID_MODELS = new Set(["gemini-embedding-001"]);
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

export function getEmbeddingConfig(userEmbeddingConfig?: any): EmbeddingConfig {
    const apiKey = userEmbeddingConfig?.apiKey || process.env.GEMINI_EMBEDDING_API_KEY || "";
    const raw = userEmbeddingConfig?.model || process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
    // Strip an accidental "models/" prefix — the request URL adds it itself.
    const cleaned = String(raw).replace(/^models\//, "").trim();
    // Coerce retired / unknown names (text-embedding-004, embedding-001,
    // text-embedding-preview-0409…) to the supported model so old saved configs
    // don't break the RAG build.
    const model = VALID_MODELS.has(cleaned) ? cleaned : DEFAULT_EMBEDDING_MODEL;
    return { apiKey, model };
}
