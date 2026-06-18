import { Request, Response, NextFunction } from "express";
import ApiKey from "../models/ApiKey.model";

/**
 * Middleware that authenticates via `X-API-Key` header.
 * Sets `req.apiKeyUserId` on success so downstream handlers know who owns the key.
 */
export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers["x-api-key"] as string | undefined;

    if (!key) {
        return res.status(401).json({ ok: false, errors: [{ msg: "Missing X-API-Key header" }] });
    }

    try {
        const apiKey = await ApiKey.findOne({ where: { key, isActive: true } });
        if (!apiKey) {
            return res.status(401).json({ ok: false, errors: [{ msg: "Invalid or inactive API key" }] });
        }

        // Touch last-used timestamp (fire & forget)
        apiKey.update({ lastUsedAt: new Date() }).catch(() => {});

        (req as any).apiKeyUserId = apiKey.userId;
        next();
    } catch {
        return res.status(500).json({ ok: false, errors: [{ msg: "API key verification failed" }] });
    }
};
