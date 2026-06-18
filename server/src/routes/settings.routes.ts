import { Router } from "express";
import { getOpenRouterSettings, updateOpenRouterSettings, getOpenRouterUsage, getOpenRouterKeyForMcp, getOpenRouterModels } from "../handlers/settings.handler";
import { verifyToken } from "../middleware/jwt.middleware";
import { verifyApiKey } from "../middleware/apikey.middleware";

const router = Router();

router.get("/openrouter", verifyToken, getOpenRouterSettings);
router.put("/openrouter", verifyToken, updateOpenRouterSettings);
router.get("/openrouter/usage", verifyToken, getOpenRouterUsage);
router.get("/openrouter/models", verifyToken, getOpenRouterModels);
// Accessible via X-API-Key for MCP server
router.get("/openrouter/key", verifyApiKey, getOpenRouterKeyForMcp);

export default router;
