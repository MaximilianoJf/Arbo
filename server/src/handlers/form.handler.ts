import { Request, Response } from "express";
import * as formService from "../services/form.service";
import { getUserByEmail } from "../repositories/user.repository";

export const createForm = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const form = await formService.createForm(user.id, req.body);
        return res.status(201).json({ ok: true, data: form });
    } catch (error: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getUserForms = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const forms = await formService.getUserForms(user.id);
        return res.json({ ok: true, data: forms });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getArchivedForms = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const forms = await formService.getArchivedForms(user.id);
        return res.json({ ok: true, data: forms });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getTrashedForms = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const forms = await formService.getTrashedForms(user.id);
        return res.json({ ok: true, data: forms });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getFormById = async (req: Request, res: Response) => {
    try {
        const form = await formService.getFormById(Number(req.params.id));
        return res.json({ ok: true, data: form });
    } catch (error: any) {
        return res.status(404).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getFormBySlug = async (req: Request, res: Response) => {
    try {
        const form = await formService.getFormBySlug(req.params.slug);
        // Compute isOwner: only true when the requester is the form creator.
        let isOwner = false;
        if ((req as any).email) {
            const user = await getUserByEmail((req as any).email);
            isOwner = !!user && user.id === (form as any).userId;
        }
        return res.json({ ok: true, data: { ...form, isOwner } });
    } catch (error: any) {
        return res.status(404).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const updateForm = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const form = await formService.updateForm(Number(req.params.id), user.id, req.body, user.email);
        return res.json({ ok: true, data: form });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// Soft delete → trash
export const deleteForm = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        await formService.softDeleteForm(Number(req.params.id), user.id);
        return res.json({ ok: true, data: { msg: "Form moved to trash" } });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// Restore from trash
export const restoreForm = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        await formService.restoreForm(Number(req.params.id), user.id);
        return res.json({ ok: true, data: { msg: "Form restored" } });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// Permanent delete
export const permanentDeleteForm = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        await formService.deleteForm(Number(req.params.id), user.id);
        return res.json({ ok: true, data: { msg: "Form permanently deleted" } });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// Archive
export const archiveForm = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        await formService.archiveForm(Number(req.params.id), user.id);
        return res.json({ ok: true, data: { msg: "Form archived" } });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// Unarchive
export const unarchiveForm = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        await formService.unarchiveForm(Number(req.params.id), user.id);
        return res.json({ ok: true, data: { msg: "Form unarchived" } });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// ─── Collaborators ───
export const addCollaborator = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const { email, role } = req.body;
        const collab = await formService.addCollaborator(Number(req.params.id), user.id, email, role);
        return res.status(201).json({ ok: true, data: collab });
    } catch (error: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const removeCollaborator = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        await formService.removeCollaborator(Number(req.params.id), user.id, req.params.email);
        return res.json({ ok: true, data: { msg: "Collaborator removed" } });
    } catch (error: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const updateCollaboratorRole = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const collab = await formService.updateCollaboratorRole(
            Number(req.params.id), user.id, req.params.email, req.body.role
        );
        return res.json({ ok: true, data: collab });
    } catch (error: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getCollaborators = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const collabs = await formService.getCollaborators(Number(req.params.id), user.id, user.email);
        return res.json({ ok: true, data: collabs });
    } catch (error: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getSharedForms = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const shared = await formService.getSharedForms(user.email);
        return res.json({ ok: true, data: shared });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// ─── Responses ───
export const checkMyResponse = async (req: Request, res: Response) => {
    try {
        const user = req.email ? await getUserByEmail(req.email) : null;
        if (!user) return res.json({ ok: true, data: { hasResponded: false } });
        const ref = req.query.ref as string | undefined;
        const hasResponded = await formService.checkUserAlreadyResponded(Number(req.params.id), user.id, ref);
        return res.json({ ok: true, data: { hasResponded } });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// Returns another form's records as { value, label } options for a foreign-key field.
export const getFormOptions = async (req: Request, res: Response) => {
    try {
        const labelField = req.query.labelField as string | undefined;
        const options = await formService.getFormOptions(Number(req.params.id), labelField);
        return res.json({ ok: true, data: options });
    } catch (error: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const submitResponse = async (req: Request, res: Response) => {
    try {
        const user = req.email ? await getUserByEmail(req.email) : null;
        // Authenticated users always identify with their account data, not client-supplied values.
        const respondentName = user?.name || req.body.respondentName || null;
        const respondentEmail = user?.email || req.body.respondentEmail || null;
        const { response, childForms } = await formService.submitFormResponse(
            Number(req.params.id),
            req.body.answers,
            user?.id,
            respondentName,
            respondentEmail,
            req.body.respondentData,
            req.body.ref,
            req.body.ref2
        );
        return res.status(201).json({ ok: true, data: response, childForms });
    } catch (error: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const nullifyResponseFields = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });
        const fieldNames: string[] = req.body.fieldNames || [];
        if (!Array.isArray(fieldNames) || fieldNames.length === 0) {
            return res.status(400).json({ ok: false, errors: [{ msg: "fieldNames must be a non-empty array." }] });
        }
        const updated = await formService.nullifyResponseFields(Number(req.params.id), user.id, fieldNames, user.email);
        return res.json({ ok: true, data: { updated } });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 500;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getFormResponseCount = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });
        const count = await formService.countFormResponses(Number(req.params.id), user.id, user.email);
        return res.json({ ok: true, data: { count } });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 500;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getFormResponses = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const responses = await formService.getFormResponses(Number(req.params.id), user.id, user.email);
        return res.json({ ok: true, data: responses });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 500;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const getResponseChain = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const chain = await formService.getResponseChain(Number(req.params.id), user.id, user.email);
        return res.json({ ok: true, data: chain });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 500;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const deleteFormResponse = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        await formService.deleteFormResponse(Number(req.params.id), Number(req.params.responseId), user.id, user.email);
        return res.json({ ok: true, data: { msg: "Respuesta eliminada" } });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// ─── Partial styles patch ───
export const patchFormStyles = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });
        const updated = await formService.patchFormStyles(Number(req.params.id), user.id, req.body, user.email);
        return res.json({ ok: true, data: updated?.styles ?? null });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// ─── PDF layout ───
export const savePdfLayout = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const updated = await formService.savePdfLayout(Number(req.params.id), user.id, req.body.layout, user.email);
        return res.json({ ok: true, data: updated?.styles ?? null });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// ─── Dashboard layout ───
export const saveDashboardLayout = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const updated = await formService.saveDashboardLayout(Number(req.params.id), user.id, req.body.layout, user.email);
        return res.json({ ok: true, data: updated?.styles ?? null });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};
