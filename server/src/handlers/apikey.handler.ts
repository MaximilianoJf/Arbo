import { Request, Response } from "express";
import crypto from "crypto";
import ApiKey from "../models/ApiKey.model";
import UserForm from "../models/UserForm.model";
import FormField from "../models/FormField.model";
import FormResponse from "../models/FormResponse.model";
import { getUserByEmail } from "../repositories/user.repository";
import * as formService from "../services/form.service";
import * as formRepo from "../repositories/form.repository";

/** Generate a prefixed API key: arbo_xxxx...xxxx */
const generateKey = () => `arbo_${crypto.randomBytes(24).toString("hex")}`;

// ─── CRUD (JWT-authenticated) ───

export const createApiKey = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const { name } = req.body;
        if (!name?.trim()) return res.status(400).json({ ok: false, errors: [{ msg: "Name is required" }] });

        const key = generateKey();
        const apiKey = await ApiKey.create({ key, name: name.trim(), userId: user.id });

        // Return the plain key only on creation — it won't be shown again
        return res.status(201).json({ ok: true, data: { id: apiKey.id, key, name: apiKey.name, createdAt: apiKey.createdAt } });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const listApiKeys = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const keys = await ApiKey.findAll({
            where: { userId: user.id },
            attributes: ["id", "name", "isActive", "lastUsedAt", "createdAt"],
            order: [["createdAt", "DESC"]],
        });

        return res.json({ ok: true, data: keys });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const revokeApiKey = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const apiKey = await ApiKey.findOne({ where: { id: Number(req.params.keyId), userId: user.id } });
        if (!apiKey) return res.status(404).json({ ok: false, errors: [{ msg: "API key not found" }] });

        await apiKey.update({ isActive: false });
        return res.json({ ok: true, data: { msg: "API key revoked" } });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

export const deleteApiKey = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const apiKey = await ApiKey.findOne({ where: { id: Number(req.params.keyId), userId: user.id } });
        if (!apiKey) return res.status(404).json({ ok: false, errors: [{ msg: "API key not found" }] });

        await apiKey.destroy();
        return res.json({ ok: true, data: { msg: "API key deleted" } });
    } catch (error: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// ─── Public Data API (API-key authenticated) ───

export const getFormsList = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).apiKeyUserId;

        const forms = await UserForm.findAll({
            where: { userId, isArchived: false, deletedAt: null },
            attributes: ["id", "title", "slug", "isPublished", "createdAt", "updatedAt"],
            include: [{ model: FormField, as: "fields", attributes: ["name", "label", "type", "componentType"] }],
            order: [["createdAt", "DESC"]],
        });

        return res.json(forms);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getFormData = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).apiKeyUserId;

        const form = await UserForm.findOne({
            where: { id: Number(req.params.formId), userId },
            include: [{ model: FormField, as: "fields", attributes: ["name", "label", "type", "componentType", "sortOrder"] }],
        });

        if (!form) return res.status(404).json({ error: "Form not found" });

        const responses = await FormResponse.findAll({
            where: { formId: form.id },
            order: [["createdAt", "ASC"]],
        });

        // Flatten for Power BI — each response is a row, answers are spread as columns
        const fields = form.fields.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .filter((f: any) => !f.name.startsWith("__page_break_"));

        const rows = responses.map((r: any) => {
            const row: Record<string, any> = {
                response_id: r.id,
                respondent_name: r.respondentName || null,
                respondent_email: r.respondentEmail || null,
                submitted_at: r.createdAt,
            };
            // Spread dynamic respondent data (phone, company, etc.)
            if (r.respondentData && typeof r.respondentData === "object") {
                for (const [key, val] of Object.entries(r.respondentData)) {
                    if (!["respondentName", "respondentEmail", "name", "email"].includes(key)) {
                        row[`contact_${key}`] = val ?? null;
                    }
                }
            }
            for (const f of fields) {
                const val = r.answers[f.name];
                row[f.name] = Array.isArray(val) ? val.join(", ") : val ?? null;
            }
            return row;
        });

        return res.json({
            form: { id: form.id, title: form.title, slug: form.slug },
            columns: [
                { name: "response_id", type: "number" },
                { name: "respondent_name", type: "string" },
                { name: "respondent_email", type: "string" },
                { name: "submitted_at", type: "datetime" },
                ...fields.map((f: any) => ({ name: f.name, label: f.label, type: f.type })),
            ],
            rows,
            total: rows.length,
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// ─── Write API (API-key authenticated) ───

/** Create a new form with fields */
export const createFormViaApi = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).apiKeyUserId;
        const { title, description, onSubmit, fields, styles, projectId } = req.body;

        if (!title?.trim()) return res.status(400).json({ error: "title is required" });

        const form = await formService.createForm(userId, {
            title: title.trim(),
            description: description || "",
            onSubmit: onSubmit || "SaveToDB",
            styles: styles || null,
            fields: fields || [],
            projectId: projectId ?? null,
        });

        return res.status(201).json(form);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

/** Update an existing form */
export const updateFormViaApi = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).apiKeyUserId;
        const formId = Number(req.params.formId);

        const form = await formService.updateForm(formId, userId, req.body, "");
        return res.json(form);
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ error: error.message });
    }
};

/** Publish / unpublish a form */
export const publishFormViaApi = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).apiKeyUserId;
        const formId = Number(req.params.formId);
        const { published } = req.body;

        const form = await formRepo.getFormById(formId);
        if (!form) return res.status(404).json({ error: "Form not found" });
        if (form.userId !== userId) return res.status(403).json({ error: "Unauthorized" });

        await form.update({ isPublished: !!published });
        return res.json({ id: form.id, title: form.title, slug: form.slug, isPublished: form.isPublished });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

/** Delete a form (soft delete) */
export const deleteFormViaApi = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).apiKeyUserId;
        const formId = Number(req.params.formId);

        await formService.softDeleteForm(formId, userId);
        return res.json({ ok: true, msg: "Form moved to trash" });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ error: error.message });
    }
};
