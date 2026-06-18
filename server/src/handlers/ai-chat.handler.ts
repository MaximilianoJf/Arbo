import { Request, Response } from "express";
import { chatWithAI, ChatMessage } from "../services/ai-chat.service";

export const handleAIChat = async (req: Request, res: Response) => {
    try {
        const { messages, currentSchema } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "messages array is required" });
        }

        if (!currentSchema) {
            return res.status(400).json({ error: "currentSchema is required" });
        }

        const result = await chatWithAI(messages as ChatMessage[], currentSchema);
        return res.json({ ok: true, data: result });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
