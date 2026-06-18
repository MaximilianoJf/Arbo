/**
 * Signed reference tokens that link a child form response back to its parent.
 *
 * When a respondent finishes form A we hand them a link to the related form B
 * carrying `?ref=<token>`. The token is a signed envelope of the parent
 * response id (and the chain root), so B's submission can be attached to A's
 * response without trusting a raw, forgeable id in the URL.
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "arbo_key";
// The second form may be answered days or weeks later — keep the link valid long enough.
const REF_TOKEN_TTL = "90d";

export interface RefPayload {
    /** Parent response this submission descends from. */
    parentResponseId: number;
    /** Root of the whole chain (A in A→B→C). Equals parentResponseId at the first hop. */
    rootResponseId: number;
}

export const signRefToken = (payload: RefPayload): string =>
    jwt.sign({ p: payload.parentResponseId, r: payload.rootResponseId }, JWT_SECRET, { expiresIn: REF_TOKEN_TTL });

/** Returns the decoded reference, or null when the token is missing, invalid or expired. */
export const verifyRefToken = (token: string | undefined | null): RefPayload | null => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { p?: number; r?: number };
        if (typeof decoded.p !== "number") return null;
        return { parentResponseId: decoded.p, rootResponseId: decoded.r ?? decoded.p };
    } catch {
        return null;
    }
};
