import { Request, Response } from "express";
import { getUserByEmail } from "../repositories/user.repository.js";
import { runAgent, AgentMessage } from "../services/ai-agent.service.js";

export const chat = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const { messages } = req.body as { messages: AgentMessage[] };
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ ok: false, errors: [{ msg: "messages requerido" }] });
        }

        const reply = await runAgent(messages, user.id, user.email);
        return res.json({ ok: true, data: { reply } });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};
