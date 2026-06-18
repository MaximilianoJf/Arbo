import { Request, Response } from "express";
import { getUserByEmail } from "../repositories/user.repository";
import * as formRepo from "../repositories/form.repository";
import { analyzeResponses } from "../services/ai-analysis.service";

export const analyzeFormResponses = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const formId = Number(req.params.id);
        const form = await formRepo.getFormById(formId);
        if (!form) return res.status(404).json({ ok: false, errors: [{ msg: "Form not found" }] });

        // Verify ownership or collaborator
        if (form.userId !== user.id) {
            const collab = await formRepo.isCollaborator(formId, user.email);
            if (!collab) return res.status(403).json({ ok: false, errors: [{ msg: "Unauthorized" }] });
        }

        const responses = await formRepo.getFormResponses(formId);
        if (responses.length === 0) {
            return res.status(400).json({ ok: false, errors: [{ msg: "No responses to analyze" }] });
        }

        const fields = (form.fields || [])
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((f: any) => ({
                name: f.name,
                label: f.label,
                type: f.type,
                componentType: f.componentType,
            }));

        const customPrompt: string | undefined = req.body?.prompt || undefined;

        const analysis = await analyzeResponses({
            formTitle: form.title,
            formDescription: form.description || undefined,
            fields,
            responses: responses.map((r: any) => ({
                answers: r.answers,
                respondentName: r.respondentName,
                respondentEmail: r.respondentEmail,
                createdAt: r.createdAt,
            })),
        }, customPrompt, user.id);

        return res.json({ ok: true, data: analysis });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};
