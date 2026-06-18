import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ msg: "No token provided" });
    }

    // Accept "Bearer <token>" or a bare token; reject anything without an actual token.
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : header.trim();
    if (!token) {
        return res.status(401).json({ msg: "No token provided" });
    }

    try {
        const { email } = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
        (req as any).email = email;
        next();
    } catch {
        return res.status(401).json({ msg: "Invalid token" });
    }
};
