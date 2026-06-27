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

// Embedding models valid on the Generative Language API (v1beta embedContent)
// that return 768-dim vectors — matching the hardcoded Qdrant collection size.
const VALID_768_MODELS = new Set(["text-embedding-004", "embedding-001"]);
const DEFAULT_EMBEDDING_MODEL = "text-embedding-004";

export function getEmbeddingConfig(userEmbeddingConfig?: any): EmbeddingConfig {
    const apiKey = userEmbeddingConfig?.apiKey || process.env.GEMINI_EMBEDDING_API_KEY || "";
    const raw = userEmbeddingConfig?.model || process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
    // Strip an accidental "models/" prefix — the request URL adds it itself.
    const cleaned = String(raw).replace(/^models\//, "").trim();
    // Coerce unknown / Vertex-only names (e.g. text-embedding-preview-0409) to a
    // valid 768-dim model so old saved configs don't break the RAG build.
    const model = VALID_768_MODELS.has(cleaned) ? cleaned : DEFAULT_EMBEDDING_MODEL;
    return { apiKey, model };
}
