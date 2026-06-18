import { Op } from "sequelize";
import UserForm from "../models/UserForm.model";
import FormField from "../models/FormField.model";
import FormResponse from "../models/FormResponse.model";
import FormCollaborator from "../models/FormCollaborator.model";
import FormRelation from "../models/FormRelation.model";
import User from "../models/User.model";
import Project from "../models/Project.model";
import type { CreateFormFieldInput } from "../types/form.types";

export const createForm = async (data: {
    userId: number;
    title: string;
    description?: string;
    slug: string;
    onSubmit?: string;
    styles?: Record<string, any> | null;
    projectId?: number | null;
}) => {
    return await UserForm.create(data);
};

export const createFormFields = async (formId: number, fields: CreateFormFieldInput[]) => {
    const fieldData = fields.map((field, index) => ({
        ...field,
        formId,
        sortOrder: field.sortOrder ?? index,
    }));
    return await FormField.bulkCreate(fieldData);
};

// Active forms (not archived, not deleted)
export const getFormsByUserId = async (userId: number) => {
    return await UserForm.findAll({
        where: { userId, isArchived: false, deletedAt: null },
        include: [
            { model: FormField, as: "fields" },
            { model: Project, attributes: ["id", "name", "color"] },
        ],
        order: [["createdAt", "DESC"]],
    });
};

// Archived forms
export const getArchivedFormsByUserId = async (userId: number) => {
    return await UserForm.findAll({
        where: { userId, isArchived: true, deletedAt: null },
        include: [{ model: FormField, as: "fields" }],
        order: [["createdAt", "DESC"]],
    });
};

// Trashed forms (soft-deleted)
export const getTrashedFormsByUserId = async (userId: number) => {
    return await UserForm.findAll({
        where: { userId, deletedAt: { [Op.ne]: null } },
        include: [{ model: FormField, as: "fields" }],
        order: [["deletedAt", "DESC"]],
    });
};

export const getFormById = async (id: number) => {
    return await UserForm.findByPk(id, {
        include: [
            { model: FormField, as: "fields", order: [["sortOrder", "ASC"]] },
            { model: Project, attributes: ["id", "name", "color"] },
        ],
    });
};

export const getFormBySlug = async (slug: string) => {
    return await UserForm.findOne({
        where: { slug },
        include: [{ model: FormField, as: "fields", order: [["sortOrder", "ASC"]] }],
    });
};

export const updateForm = async (id: number, data: Partial<UserForm>) => {
    const form = await UserForm.findByPk(id);
    if (!form) return null;
    return await form.update(data);
};

export const deleteFormFieldsByFormId = async (formId: number) => {
    return await FormField.destroy({ where: { formId } });
};

// Soft delete
export const softDeleteForm = async (id: number) => {
    const form = await UserForm.findByPk(id);
    if (!form) return null;
    return await form.update({ deletedAt: new Date(), isArchived: false });
};

// Restore from trash
export const restoreForm = async (id: number) => {
    const form = await UserForm.findByPk(id);
    if (!form) return null;
    return await form.update({ deletedAt: null });
};

// Permanent delete
export const deleteForm = async (id: number) => {
    const form = await UserForm.findByPk(id);
    if (!form) return null;
    await FormField.destroy({ where: { formId: id } });
    await FormResponse.destroy({ where: { formId: id } });
    await FormCollaborator.destroy({ where: { formId: id } });
    await form.destroy();
    return form;
};

// Archive / Unarchive
export const archiveForm = async (id: number) => {
    const form = await UserForm.findByPk(id);
    if (!form) return null;
    return await form.update({ isArchived: true });
};

export const unarchiveForm = async (id: number) => {
    const form = await UserForm.findByPk(id);
    if (!form) return null;
    return await form.update({ isArchived: false });
};

// ─── Collaborators ───
export const addCollaborator = async (formId: number, email: string, role: string, userId?: number) => {
    return await FormCollaborator.create({ formId, email, role, userId: userId || null });
};

export const removeCollaborator = async (formId: number, email: string) => {
    return await FormCollaborator.destroy({ where: { formId, email } });
};

export const getCollaborators = async (formId: number) => {
    return await FormCollaborator.findAll({
        where: { formId },
        include: [{ model: User, attributes: ["id", "name", "email"] }],
        order: [["createdAt", "ASC"]],
    });
};

// Forms shared with a user (by email)
export const getSharedForms = async (email: string) => {
    const collabs = await FormCollaborator.findAll({
        where: { email },
        include: [{
            model: UserForm,
            include: [
                { model: FormField, as: "fields" },
                { model: User, attributes: ["id", "name", "email"] },
            ],
        }],
        order: [["createdAt", "DESC"]],
    });
    return collabs;
};

// Check if user is collaborator on a form
export const isCollaborator = async (formId: number, email: string) => {
    const collab = await FormCollaborator.findOne({ where: { formId, email } });
    return collab;
};

export const createFormResponse = async (data: {
    formId: number;
    respondentId?: number;
    respondentName?: string;
    respondentEmail?: string;
    respondentData?: Record<string, any> | null;
    answers: Record<string, any>;
    parentResponseId?: number | null;
    parentFormId?: number | null;
    rootResponseId?: number | null;
    secondaryResponseId?: number | null;
}) => {
    return await FormResponse.create(data);
};

export const getFormResponses = async (formId: number) => {
    return await FormResponse.findAll({
        where: { formId },
        order: [["createdAt", "DESC"]],
    });
};

export const countFormResponses = async (formId: number): Promise<number> => {
    return await FormResponse.count({ where: { formId } });
};

export const getFormResponseById = async (formId: number, responseId: number) => {
    return await FormResponse.findOne({ where: { id: responseId, formId } });
};

/** Fetch a response by id alone (used to resolve a parent in a relation chain). */
export const getResponseById = async (id: number) => {
    return await FormResponse.findByPk(id);
};

/** Direct child responses of the given parent responses (one level down the chain). */
export const getResponsesByParentIds = async (parentIds: number[]) => {
    if (!parentIds.length) return [];
    return await FormResponse.findAll({
        where: { parentResponseId: { [Op.in]: parentIds } },
        order: [["createdAt", "ASC"]],
    });
};

/** Minimal info for several responses by id (used for parent breadcrumbs). */
export const getResponsesByIds = async (ids: number[]) => {
    if (!ids.length) return [];
    return await FormResponse.findAll({ where: { id: { [Op.in]: ids } } });
};

export const deleteFormResponse = async (formId: number, responseId: number) => {
    return await FormResponse.destroy({ where: { id: responseId, formId } });
};

/** Merge a partial styles object into the form's existing styles JSONB. */
export const updateFormStyles = async (formId: number, patch: Record<string, any>) => {
    const form = await UserForm.findByPk(formId);
    if (!form) return null;
    const merged = { ...(form.styles || {}), ...patch };
    return await form.update({ styles: merged });
};

// ─── Form relations (chain) ───
export const getProjectRelations = async (projectId: number) => {
    return await FormRelation.findAll({
        where: { projectId },
        order: [["createdAt", "ASC"]],
    });
};

/** Replaces the full set of relations for a project (drop-and-recreate). */
export const replaceProjectRelations = async (
    projectId: number,
    relations: { parentFormId: number; childFormId: number; keyField?: string | null; type?: string; joinFormId?: number | null }[],
) => {
    await FormRelation.destroy({ where: { projectId } });
    if (!relations.length) return [];
    const rows = relations.map((r) => ({
        projectId,
        parentFormId: r.parentFormId,
        childFormId: r.childFormId,
        keyField: r.keyField ?? null,
        type: r.type ?? "one_to_many",
        joinFormId: r.joinFormId ?? null,
    }));
    return await FormRelation.bulkCreate(rows);
};

/** Whether a parent response already has a child response in the given form (for 1:1 enforcement). */
export const hasChildInForm = async (parentResponseId: number, formId: number): Promise<boolean> => {
    const existing = await FormResponse.findOne({ where: { parentResponseId, formId } });
    return !!existing;
};

/** Whether an authenticated respondent already has a response for this form.
 *  When parentResponseId is provided (relational ?ref= flow), the check is scoped
 *  to that specific parent so the same user can fill the form for different parents. */
export const hasResponseFromUser = async (
    formId: number,
    respondentId: number,
    parentResponseId?: number,
): Promise<boolean> => {
    const where: Record<string, any> = { formId, respondentId };
    if (parentResponseId !== undefined) where.parentResponseId = parentResponseId;
    const existing = await FormResponse.findOne({ where });
    return !!existing;
};

/** Child relations of a form, with the child form's slug/title for building links. */
export const getChildRelations = async (parentFormId: number) => {
    return await FormRelation.findAll({
        where: { parentFormId },
        include: [{ model: UserForm, as: "childForm", attributes: ["id", "title", "slug"] }],
    });
};

/** The relation between two forms, if one exists. */
export const getRelation = async (parentFormId: number, childFormId: number) => {
    return await FormRelation.findOne({ where: { parentFormId, childFormId } });
};

/** Whether this form appears as the child side of any relation (requires auth to respond). */
export const isFormChild = async (formId: number): Promise<boolean> => {
    const rel = await FormRelation.findOne({ where: { childFormId: formId } });
    return !!rel;
};
