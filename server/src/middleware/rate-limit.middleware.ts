import rateLimit from "express-rate-limit";

/** Tight limit on auth endpoints to blunt credential brute-forcing. */
export const authLimiter = rateLimit({
    windowMs: 15 * 60_000, // 15 min
    max: 20,               // 20 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, errors: [{ msg: "Demasiados intentos. Probá de nuevo en unos minutos." }] },
});

/** Limit on AI endpoints — each call costs money / quota, so cap per IP. */
export const aiLimiter = rateLimit({
    windowMs: 60_000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, errors: [{ msg: "Demasiadas solicitudes a la IA. Esperá un momento." }] },
});
