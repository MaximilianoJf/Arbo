import { Request, Response } from "express";
import * as projectService from "../services/project.service";
import { getUserByEmail } from "../repositories/user.repository";

const getUserId = async (email: string) => {
    const user = await getUserByEmail(email);
    if (!user) throw new Error("User not found");
    return user.id;
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const project = await projectService.create(userId, req.body);
        return res.json({ ok: true, data: project });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const projects = await projectService.getAll(userId, req.email);
        return res.json({ ok: true, data: projects });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const getProject = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const project = await projectService.getById(Number(req.params.id), userId, req.email);
        return res.json({ ok: true, data: project });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const project = await projectService.update(Number(req.params.id), userId, req.body);
        return res.json({ ok: true, data: project });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const deleteForms = req.query.deleteForms === "true";
        await projectService.remove(Number(req.params.id), userId, deleteForms);
        return res.json({ ok: true });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// --- Collaborators ---
export const addCollaborator = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const { email, role } = req.body;
        const collab = await projectService.addCollab(Number(req.params.id), userId, email, role || "viewer");
        return res.json({ ok: true, data: collab });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const removeCollaborator = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        await projectService.removeCollab(Number(req.params.id), userId, req.params.email);
        return res.json({ ok: true });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const getCollaborators = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const collabs = await projectService.getCollabs(Number(req.params.id), userId, req.email);
        return res.json({ ok: true, data: collabs });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const updateCollaboratorRole = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const collab = await projectService.updateCollabRole(Number(req.params.id), userId, req.params.email, req.body.role);
        return res.json({ ok: true, data: collab });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// --- Form assignment ---
export const assignFormToProject = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const { formId, projectId } = req.body;
        await projectService.assignForm(formId, projectId, userId);
        return res.json({ ok: true });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// --- Form relations (chain) ---
export const getRelations = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const relations = await projectService.getRelations(Number(req.params.id), userId, req.email);
        return res.json({ ok: true, data: relations });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const saveRelations = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const relations = await projectService.saveRelations(
            Number(req.params.id), userId, req.email, req.body.relations,
        );
        return res.json({ ok: true, data: relations });
    } catch (err) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};
