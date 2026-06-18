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

const GOOGLE_TOKENINFO = "https://oauth2.googleapis.com/tokeninfo?id_token=";

export const googleCallback = async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({
                ok: false,
                errors: [{ msg: "Google credential is required" }],
            });
        }

        // Verify the ID token WITH Google before trusting any claim. Google's tokeninfo
        // endpoint validates the signature and expiry server-side. Decoding the payload
        // locally (as before) let anyone forge a token and log in as any user.
        const verifyRes = await fetch(`${GOOGLE_TOKENINFO}${encodeURIComponent(credential)}`);
        if (!verifyRes.ok) {
            return res.status(401).json({
                ok: false,
                errors: [{ msg: "Invalid or expired Google credential" }],
            });
        }
        const payload = await verifyRes.json() as Record<string, any>;

        // The token must have been issued for OUR app, not any Google client.
        const expectedAud = process.env.GOOGLE_CLIENT_ID;
        if (expectedAud && payload.aud !== expectedAud) {
            return res.status(401).json({
                ok: false,
                errors: [{ msg: "Google credential was issued for another application" }],
            });
        }

        const { sub: googleId, email, name, picture, email_verified } = payload;

        if (!email || !googleId) {
            return res.status(400).json({
                ok: false,
                errors: [{ msg: "Invalid Google profile data" }],
            });
        }
        if (email_verified === false || email_verified === "false") {
            return res.status(401).json({
                ok: false,
                errors: [{ msg: "Google email is not verified" }],
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
