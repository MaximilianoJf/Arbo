import { Request, Response } from "express";
import { getUserByEmail } from "../repositories/user.repository.js";
import * as formRepo from "../repositories/form.repository.js";
import { generateDashboardHtml } from "../services/dashboard.service.js";

export const generateDashboard = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const formId = Number(req.params.id);
        const form = await formRepo.getFormById(formId);
        if (!form) return res.status(404).json({ ok: false, errors: [{ msg: "Form not found" }] });

        if (form.userId !== user.id) {
            const collab = await formRepo.isCollaborator(formId, user.email);
            if (!collab) return res.status(403).json({ ok: false, errors: [{ msg: "Unauthorized" }] });
        }

        const responses = await formRepo.getFormResponses(formId);
        if (responses.length === 0) {
            return res.status(400).json({ ok: false, errors: [{ msg: "No hay respuestas para analizar" }] });
        }

        const fields = (form.fields as any[] || [])
            .filter((f: any) => !f.name?.startsWith("__page_break_"))
            .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        const html = await generateDashboardHtml({
            title: form.title || "Formulario",
            description: form.description || undefined,
            fields,
            responses,
            prompt: (req.body?.prompt as string) || undefined,
            design: req.body?.design || undefined,
            userId: user.id,
        });

        const slug = (form.slug || `form-${formId}`).replace(/[^a-z0-9-]/gi, "-");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="dashboard-${slug}.html"`);
        res.send(html);
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};
