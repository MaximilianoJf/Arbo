import { Request, Response } from "express";
import { scanFormImage } from "../services/ai-scan.service";
import { getUserByEmail } from "../repositories/user.repository";

export const handleAIScan = async (req: Request, res: Response) => {
    try {
        const { image } = req.body;

        if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
            return res.status(400).json({ error: "image (data URL base64) is required" });
        }
        if (image.length > 10 * 1024 * 1024) {
            return res.status(413).json({ error: "La imagen es demasiado grande" });
        }

        const user = await getUserByEmail(req.email!);
        const result = await scanFormImage(image, user?.id);
        return res.json({ ok: true, data: result });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
