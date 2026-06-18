import { Request, Response } from "express";
import { generateRelationalSchema } from "../services/ai-schema.service";

export const handleAIGenerateSchema = async (req: Request, res: Response) => {
    try {
        const { description } = req.body;
        if (!description?.trim()) {
            return res.status(400).json({ ok: false, errors: [{ msg: "Se requiere una descripción." }] });
        }
        const schema = await generateRelationalSchema(String(description).trim());
        return res.json({ ok: true, data: schema });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};
