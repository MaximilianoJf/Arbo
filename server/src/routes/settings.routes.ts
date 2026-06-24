import { Router } from "express";
import { getOpenRouterSettings, updateOpenRouterSettings, getOpenRouterUsage, getOpenRouterKeyForMcp, getOpenRouterModels, getEmbeddingSettings, updateEmbeddingSettings, getQdrantSettings, updateQdrantSettings } from "../handlers/settings.handler";
import { getAIProviders, updateAIProvider, updateAIProviderOrder } from "../handlers/ai-providers.handler";
import { verifyToken } from "../middleware/jwt.middleware";
import { verifyApiKey } from "../middleware/apikey.middleware";

const router = Router();

router.get("/openrouter", verifyToken, getOpenRouterSettings);
router.put("/openrouter", verifyToken, updateOpenRouterSettings);
router.get("/openrouter/usage", verifyToken, getOpenRouterUsage);
router.get("/openrouter/models", verifyToken, getOpenRouterModels);
// Accessible via X-API-Key for MCP server
router.get("/openrouter/key", verifyApiKey, getOpenRouterKeyForMcp);

// Multi-provider AI failover (free APIs) + per-provider consumption
router.get("/ai-providers", verifyToken, getAIProviders);
router.put("/ai-providers/order", verifyToken, updateAIProviderOrder);
router.put("/ai-providers/:id", verifyToken, updateAIProvider);

// Embeddings config (Gemini embedding API)
router.get("/embedding", verifyToken, getEmbeddingSettings);
router.put("/embedding", verifyToken, updateEmbeddingSettings);

// Qdrant vector DB config
router.get("/qdrant", verifyToken, getQdrantSettings);
router.put("/qdrant", verifyToken, updateQdrantSettings);

export default router;
