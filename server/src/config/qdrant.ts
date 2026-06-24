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

export function getEmbeddingConfig(userEmbeddingConfig?: any): EmbeddingConfig {
    const apiKey = userEmbeddingConfig?.apiKey || process.env.GEMINI_EMBEDDING_API_KEY || "";
    const model = userEmbeddingConfig?.model || process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
    return { apiKey, model };
}
