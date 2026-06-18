import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ApiKey from "../models/ApiKey.model";
import User from "../models/User.model";

/**
 * Accepts either a JWT Bearer token OR an X-API-Key header.
 * Always resolves to req.email so downstream handlers stay unchanged.
 */
export const verifyTokenOrApiKey = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers["x-api-key"] as string | undefined;

    // ── JWT path ──
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        try {
            const { email } = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
            (req as any).email = email;
            return next();
        } catch {
            return res.status(401).json({ ok: false, errors: [{ msg: "Invalid token" }] });
        }
    }

    // ── API Key path ──
    if (apiKeyHeader) {
        try {
            const apiKey = await ApiKey.findOne({
                where: { key: apiKeyHeader, isActive: true },
                include: [{ model: User, attributes: ["email"] }],
            });
            if (!apiKey || !apiKey.user) {
                return res.status(401).json({ ok: false, errors: [{ msg: "Invalid or inactive API key" }] });
            }
            apiKey.update({ lastUsedAt: new Date() }).catch(() => {});
            (req as any).email = apiKey.user.email;
            return next();
        } catch {
            return res.status(500).json({ ok: false, errors: [{ msg: "API key verification failed" }] });
        }
    }

    return res.status(401).json({ ok: false, errors: [{ msg: "No authentication provided" }] });
};

/**
 * Reads a Bearer token if present and sets req.email, but never rejects.
 * Used on public submit so an authenticated (e.g. Google) respondent is identified,
 * while anonymous submissions still go through.
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        try {
            const { email } = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
            (req as any).email = email;
        } catch { /* ignore invalid/expired token on public submit */ }
    }
    next();
};
