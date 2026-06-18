import { Request, Response } from "express";
import FieldBlock from "../models/FieldBlock.model";
import User from "../models/User.model";
import { getUserByEmail } from "../repositories/user.repository";

const getUserId = async (email: string) => {
    const user = await getUserByEmail(email);
    if (!user) throw new Error("User not found");
    return user.id;
};

/** Own library (includes blocks added/copied from other users). */
export const getMyBlocks = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const blocks = await FieldBlock.findAll({ where: { userId }, order: [["createdAt", "DESC"]] });
        return res.json({ ok: true, data: blocks });
    } catch (err: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

/** Public blocks shared by other users. */
export const getPublicBlocks = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const blocks = await FieldBlock.findAll({
            where: { isPublic: true },
            include: [{ model: User, attributes: ["name", "email"] }],
            order: [["createdAt", "DESC"]],
            limit: 100,
        });
        // Exclude own blocks from the public browse list
        const data = blocks.filter((b) => b.userId !== userId);
        return res.json({ ok: true, data });
    } catch (err: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const createBlock = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const { name, description, fields, isPublic } = req.body;
        if (!name || !Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({ ok: false, errors: [{ msg: "name y fields (no vacío) son obligatorios" }] });
        }
        const block = await FieldBlock.create({
            name: String(name).slice(0, 120),
            description: description ? String(description).slice(0, 500) : null,
            fields,
            isPublic: !!isPublic,
            userId,
        });
        return res.json({ ok: true, data: block });
    } catch (err: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const updateBlock = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const block = await FieldBlock.findOne({ where: { id: Number(req.params.id), userId } });
        if (!block) return res.status(404).json({ ok: false, errors: [{ msg: "Componente no encontrado" }] });
        const { name, description, fields, isPublic } = req.body;
        if (name !== undefined) block.name = String(name).slice(0, 120);
        if (description !== undefined) block.description = description ? String(description).slice(0, 500) : null;
        if (Array.isArray(fields) && fields.length > 0) block.fields = fields;
        if (isPublic !== undefined) block.isPublic = !!isPublic;
        await block.save();
        return res.json({ ok: true, data: block });
    } catch (err: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

export const deleteBlock = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const deleted = await FieldBlock.destroy({ where: { id: Number(req.params.id), userId } });
        if (!deleted) return res.status(404).json({ ok: false, errors: [{ msg: "Componente no encontrado" }] });
        return res.json({ ok: true });
    } catch (err: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};

/** Copies a public block from another user into the caller's library. */
export const addPublicBlock = async (req: Request, res: Response) => {
    try {
        const userId = await getUserId(req.email);
        const source = await FieldBlock.findOne({ where: { id: Number(req.params.id), isPublic: true } });
        if (!source) return res.status(404).json({ ok: false, errors: [{ msg: "Componente público no encontrado" }] });
        if (source.userId === userId) return res.status(400).json({ ok: false, errors: [{ msg: "Ya es tuyo" }] });
        const copy = await FieldBlock.create({
            name: source.name,
            description: source.description,
            fields: source.fields,
            isPublic: false,
            sourceId: source.id,
            userId,
        });
        return res.json({ ok: true, data: copy });
    } catch (err: any) {
        return res.status(400).json({ ok: false, errors: [{ msg: err.message }] });
    }
};
