import { Router } from "express";
import { verifyTokenOrApiKey } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rate-limit.middleware.js";
import { chat } from "../handlers/agent.handler.js";

const router = Router();

router.post("/chat", aiLimiter, verifyTokenOrApiKey, chat);

export default router;
