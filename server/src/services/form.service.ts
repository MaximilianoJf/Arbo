import * as formRepo from "../repositories/form.repository";
import { getUserByEmail } from "../repositories/user.repository";
import type { CreateFormInput, UpdateFormInput } from "../types/form.types";

const generateSlug = (title: string): string => {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
};

export const createForm = async (userId: number, input: CreateFormInput) => {
    const slug = generateSlug(input.title);

    const form = await formRepo.createForm({
        userId,
        title: input.title,
        description: input.description,
        slug,
        onSubmit: input.onSubmit,
        styles: input.styles || null,
        projectId: input.projectId ?? null,
    });

    if (input.fields?.length) {
        await formRepo.createFormFields(form.id, input.fields);
    }

    return await formRepo.getFormById(form.id);
};

export const getUserForms = async (userId: number) => {
    return await formRepo.getFormsByUserId(userId);
};

export const getArchivedForms = async (userId: number) => {
    return await formRepo.getArchivedFormsByUserId(userId);
};

export const getTrashedForms = async (userId: number) => {
    return await formRepo.getTrashedFormsByUserId(userId);
};

export const getFormById = async (id: number) => {
    const form = await formRepo.getFormById(id);
    if (!form) throw new Error("Form not found");
    return form;
};

export const getFormBySlug = async (slug: string) => {
    const form = await formRepo.getFormBySlug(slug);
    if (!form) throw new Error("Form not found");
    return form;
};

export const updateForm = async (id: number, userId: number, input: UpdateFormInput, userEmail?: string) => {
    const form = await formRepo.getFormById(id);
    if (!form) throw new Error("Form not found");

    // Owner or editor collaborator can update
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(id, userEmail);
        if (!collab || collab.role !== "editor") throw new Error("Unauthorized");
    }

    await formRepo.updateForm(id, {
        title: input.title,
        description: input.description,
        onSubmit: input.onSubmit,
        isPublished: input.isPublished,
        styles: input.styles !== undefined ? input.styles : undefined,
        projectId: input.projectId !== undefined ? input.projectId : undefined,
    } as any);

    if (input.fields) {
        await formRepo.deleteFormFieldsByFormId(id);
        await formRepo.createFormFields(id, input.fields);
    }

    return await formRepo.getFormById(id);
};

// Soft delete (move to trash)
export const softDeleteForm = async (id: number, userId: number) => {
    const form = await formRepo.getFormById(id);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Unauthorized");
    return await formRepo.softDeleteForm(id);
};

// Restore from trash
export const restoreForm = async (id: number, userId: number) => {
    const form = await formRepo.getFormById(id);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Unauthorized");
    return await formRepo.restoreForm(id);
};

// Permanent delete
export const deleteForm = async (id: number, userId: number) => {
    const form = await formRepo.getFormById(id);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Unauthorized");
    return await formRepo.deleteForm(id);
};

// Archive
export const archiveForm = async (id: number, userId: number) => {
    const form = await formRepo.getFormById(id);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Unauthorized");
    return await formRepo.archiveForm(id);
};

// Unarchive
export const unarchiveForm = async (id: number, userId: number) => {
    const form = await formRepo.getFormById(id);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Unauthorized");
    return await formRepo.unarchiveForm(id);
};

// ─── Collaborators ───
export const addCollaborator = async (formId: number, userId: number, email: string, role: string = "viewer") => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Only the form owner can add collaborators");

    // Check if already a collaborator
    const existing = await formRepo.isCollaborator(formId, email);
    if (existing) throw new Error("This user is already a collaborator");

    // Find user by email to link userId if they exist
    const targetUser = await getUserByEmail(email);
    return await formRepo.addCollaborator(formId, email, role, targetUser?.id);
};

export const removeCollaborator = async (formId: number, userId: number, email: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Only the form owner can remove collaborators");

    const result = await formRepo.removeCollaborator(formId, email);
    if (!result) throw new Error("Collaborator not found");
    return result;
};

export const updateCollaboratorRole = async (formId: number, userId: number, email: string, role: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) throw new Error("Only the form owner can change roles");

    const collab = await formRepo.isCollaborator(formId, email);
    if (!collab) throw new Error("Collaborator not found");
    return await collab.update({ role });
};

export const getCollaborators = async (formId: number, userId: number, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    // Owner or collaborator can see the list
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab) throw new Error("Unauthorized");
    }

    return await formRepo.getCollaborators(formId);
};

export const getSharedForms = async (email: string) => {
    return await formRepo.getSharedForms(email);
};

// ─── Responses ───
export const submitFormResponse = async (
    formId: number,
    answers: Record<string, any>,
    respondentId?: number,
    respondentName?: string,
    respondentEmail?: string,
    respondentData?: Record<string, any>
) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    return await formRepo.createFormResponse({
        formId,
        respondentId,
        respondentName,
        respondentEmail,
        respondentData: respondentData || null,
        answers,
    });
};

export const getFormResponses = async (formId: number, userId: number, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    // Owner or collaborator can view responses
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab) throw new Error("Unauthorized");
    }

    return await formRepo.getFormResponses(formId);
};

export const deleteFormResponse = async (formId: number, responseId: number, userId: number, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    // Only owner or editor collaborator can delete responses
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab || collab.role !== "editor") throw new Error("Unauthorized");
    }

    const deleted = await formRepo.deleteFormResponse(formId, responseId);
    if (!deleted) throw new Error("Respuesta no encontrada");
    return deleted;
};

// ─── PDF layout ───
export const savePdfLayout = async (formId: number, userId: number, layout: Record<string, any>, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    // Owner or editor collaborator can change the PDF layout
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab || collab.role !== "editor") throw new Error("Unauthorized");
    }

    return await formRepo.updateFormStyles(formId, { pdfLayout: layout });
};
