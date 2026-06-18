import { Router } from "express";
import { verifyTokenOrApiKey } from "../middleware/auth.middleware.js";
import { chat } from "../handlers/agent.handler.js";

const router = Router();

router.post("/chat", verifyTokenOrApiKey, chat);

export default router;
