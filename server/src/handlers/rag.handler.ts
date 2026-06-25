import { Request, Response } from "express";
import { getUserByEmail } from "../repositories/user.repository";
import * as formRepo from "../repositories/form.repository";
import { getProjectById } from "../repositories/project.repository";
import {
    buildFormRAG,
    buildProjectRAG,
    queryFormRAG,
    queryProjectRAG,
    getFormRAGStatus,
    getProjectRAGStatus,
    buildUserRAG,
    queryUserRAG,
    getUserRAGStatus,
} from "../services/rag.service";

function getUserConfig(user: any) {
    const providers = user?.aiProviders || {};
    return {
        embeddings: providers.embeddings || null,
        qdrant: providers.qdrant || null,
    };
}

// POST /rag/forms/:formId/build
export const buildFormRag = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const formId = Number(req.params.formId);
        const form = await formRepo.getFormById(formId);
        if (!form) return res.status(404).json({ ok: false, errors: [{ msg: "Formulario no encontrado" }] });

        if (form.userId !== user.id) {
            const collab = await formRepo.isCollaborator(formId, user.email);
            if (!collab) return res.status(403).json({ ok: false, errors: [{ msg: "Sin permiso" }] });
        }

        const result = await buildFormRAG(formId, getUserConfig(user));
        return res.json({ ok: true, data: result });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// POST /rag/projects/:projectId/build
export const buildProjectRag = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const projectId = Number(req.params.projectId);
        const project = await getProjectById(projectId);
        if (!project) return res.status(404).json({ ok: false, errors: [{ msg: "Proyecto no encontrado" }] });

        if ((project as any).userId !== user.id) {
            return res.status(403).json({ ok: false, errors: [{ msg: "Sin permiso" }] });
        }

        const result = await buildProjectRAG(projectId, getUserConfig(user));
        return res.json({ ok: true, data: result });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// POST /rag/forms/:formId/query
export const queryFormRag = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const formId = Number(req.params.formId);
        const { query } = req.body as { query: string };
        if (!query?.trim()) return res.status(400).json({ ok: false, errors: [{ msg: "Se requiere una consulta" }] });

        const form = await formRepo.getFormById(formId);
        if (!form) return res.status(404).json({ ok: false, errors: [{ msg: "Formulario no encontrado" }] });

        if (form.userId !== user.id) {
            const collab = await formRepo.isCollaborator(formId, user.email);
            if (!collab) return res.status(403).json({ ok: false, errors: [{ msg: "Sin permiso" }] });
        }

        const result = await queryFormRAG(formId, query.trim(), getUserConfig(user), user.id);
        return res.json({ ok: true, data: result });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// POST /rag/projects/:projectId/query
export const queryProjectRag = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const projectId = Number(req.params.projectId);
        const { query } = req.body as { query: string };
        if (!query?.trim()) return res.status(400).json({ ok: false, errors: [{ msg: "Se requiere una consulta" }] });

        const project = await getProjectById(projectId);
        if (!project) return res.status(404).json({ ok: false, errors: [{ msg: "Proyecto no encontrado" }] });

        if ((project as any).userId !== user.id) {
            return res.status(403).json({ ok: false, errors: [{ msg: "Sin permiso" }] });
        }

        const result = await queryProjectRAG(projectId, query.trim(), getUserConfig(user), user.id);
        return res.json({ ok: true, data: result });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// GET /rag/forms/:formId/status
export const getFormRagStatus = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const formId = Number(req.params.formId);
        const status = await getFormRAGStatus(formId);
        return res.json({ ok: true, data: status });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// GET /rag/projects/:projectId/status
export const getProjectRagStatus = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const projectId = Number(req.params.projectId);
        const status = await getProjectRAGStatus(projectId);
        return res.json({ ok: true, data: status });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// POST /rag/user/build
export const buildUserRag = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });
        const result = await buildUserRAG(user.id, getUserConfig(user));
        return res.json({ ok: true, data: result });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// POST /rag/user/query
export const queryUserRag = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });
        const { query } = req.body as { query: string };
        if (!query?.trim()) return res.status(400).json({ ok: false, errors: [{ msg: "Se requiere una consulta" }] });
        const result = await queryUserRAG(user.id, query.trim(), getUserConfig(user));
        return res.json({ ok: true, data: result });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

// GET /rag/user/status
export const getUserRagStatus = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });
        const status = await getUserRAGStatus(user.id);
        return res.json({ ok: true, data: status });
    } catch (err: any) {
        return res.status(500).json({ ok: false, errors: [{ msg: err.message }] });
    }
};
