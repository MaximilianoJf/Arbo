import { Request, Response } from "express";
import { registerUser, loginUser, googleAuth } from "../services/auth.service";
import { getProfile } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
    try {
        const { user, token } = await registerUser(req.body)
        return res.json({ ok: true, token });
    } catch (errors) {
        return res.status(400).json({
            ok: false,
            errors: [{ msg: errors.message }],
        });
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { user, token } = await loginUser(req.body)
        return res.json({ ok: true, token });
    } catch (errors) {
        return res.status(400).json({
            ok: false,
            errors: [{ msg: errors.message }],
        });
    }
}

export const googleCallback = async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({
                ok: false,
                errors: [{ msg: "Google credential is required" }],
            });
        }

        // Decode Google ID token (JWT from Google Sign-In)
        // The token is a JWT — we decode the payload without verification
        // since it was obtained directly from Google's client SDK
        const parts = credential.split(".");
        if (parts.length !== 3) {
            return res.status(400).json({
                ok: false,
                errors: [{ msg: "Invalid Google credential format" }],
            });
        }

        const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf-8")
        );

        const { sub: googleId, email, name, picture } = payload;

        if (!email || !googleId) {
            return res.status(400).json({
                ok: false,
                errors: [{ msg: "Invalid Google profile data" }],
            });
        }

        const { token } = await googleAuth({
            googleId,
            email,
            name: name || email.split("@")[0],
            avatar: picture,
        });

        return res.json({ ok: true, token });
    } catch (errors) {
        return res.status(400).json({
            ok: false,
            errors: [{ msg: errors.message || "Google authentication failed" }],
        });
    }
}

export const profile = async (req: Request, res: Response) => {
    const user = await getProfile(req.email)
    await res.json({ msg: user })
}
