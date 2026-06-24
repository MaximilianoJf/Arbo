import * as formRepo from "../repositories/form.repository";
import { getUserByEmail } from "../repositories/user.repository";
import { signRefToken, verifyRefToken } from "../utils/ref-token.util";
import type { CreateFormInput, UpdateFormInput } from "../types/form.types";

export interface ChildFormLink {
    formId: number;
    title: string;
    slug: string;
    url: string;
}

/**
 * Builds `?ref=`-carrying links to every child form, continuing the chain.
 * For many-to-many relations the link points at the bridge form instead, so the
 * bridge response can later reference both sides.
 */
const buildChildLinks = async (
    parentFormId: number,
    parentResponseId: number,
    rootResponseId: number,
): Promise<ChildFormLink[]> => {
    const relations = await formRepo.getChildRelations(parentFormId);
    const links: ChildFormLink[] = [];
    for (const r of relations) {
        const token = signRefToken({ parentResponseId, rootResponseId });
        if (r.type === "many_to_many" && r.joinFormId) {
            const join = await formRepo.getFormById(r.joinFormId);
            if (join) links.push({ formId: join.id, title: join.title, slug: join.slug, url: `/forms/${join.slug}?ref=${token}` });
        } else if (r.childForm) {
            links.push({ formId: r.childForm.id, title: r.childForm.title, slug: r.childForm.slug, url: `/forms/${r.childForm.slug}?ref=${token}` });
        }
    }
    return links;
};

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
    const isRelational = await formRepo.isFormChild(form.id);
    return { ...form.toJSON(), isRelational };
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
export const checkUserAlreadyResponded = async (
    formId: number,
    respondentId: number,
    ref?: string,
): Promise<boolean> => {
    const parentRef = verifyRefToken(ref);
    if (!parentRef) {
        // Forms flagged for multiple creation (e.g. an admin registering many records)
        // never block — the same user can submit as many times as they want.
        const form = await formRepo.getFormById(formId);
        if ((form?.styles as any)?.allowMultiple) return false;
        // Standalone form: one response per user.
        return await formRepo.hasResponseFromUser(formId, respondentId);
    }
    // Child form opened via ?ref=. Only block on one_to_one relations.
    const parent = await formRepo.getResponseById(parentRef.parentResponseId);
    if (!parent) return false;
    const relation = await formRepo.getRelation(parent.formId, formId);
    const isUniqueChild = relation?.type === "one_to_one" || relation?.type === "one_to_zero";
    if (!relation || !isUniqueChild) return false;
    return await formRepo.hasResponseFromUser(formId, respondentId, parent.id);
};

export const submitFormResponse = async (
    formId: number,
    answers: Record<string, any>,
    respondentId?: number,
    respondentName?: string,
    respondentEmail?: string,
    respondentData?: Record<string, any>,
    ref?: string,
    ref2?: string,
) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    // Decode the ?ref= token early — needed for both the duplicate gate and the chain resolution.
    const parentRef = verifyRefToken(ref);

    // Gate: relational child forms must be accessed via a parent ?ref= link,
    // unless the form is in "free" mode (requiresParentChain=false) or the
    // respondent is an authenticated user (owner / admin filling directly).
    if (!parentRef) {
        const isChild = await formRepo.isFormChild(formId);
        const strictChain = (form.styles as any)?.requiresParentChain !== false;
        if (isChild && strictChain && !respondentId) {
            const err: any = new Error("Este formulario debe responderse desde el formulario padre.");
            err.code = "REQUIRES_PARENT";
            throw err;
        }
    }

    // Gate: forms flagged as requiring identity can only be submitted by an authenticated user.
    if ((form.styles as any)?.requiresGoogleAuth && !respondentId) {
        throw new Error("Necesitás iniciar sesión para responder este formulario.");
    }

    // Duplicate gate: one response per authenticated user for standalone forms only.
    // Child forms opened via ?ref= skip this check — the relation block below handles
    // one_to_one uniqueness, and one_to_many / many_to_many allow unlimited entries.
    // Forms flagged `allowMultiple` (multi-record creation, e.g. an admin registering
    // many clients/pets) skip the gate entirely.
    const allowMultiple = !!(form.styles as any)?.allowMultiple;
    if (respondentId && !parentRef && !allowMultiple) {
        const alreadyResponded = await formRepo.hasResponseFromUser(formId, respondentId);
        if (alreadyResponded) {
            const err: any = new Error("Ya enviaste una respuesta para este formulario.");
            err.code = "ALREADY_RESPONDED";
            throw err;
        }
    }

    // Resolve the chain when this form was opened from a parent's `?ref=` link.
    let parentResponseId: number | null = null;
    let parentFormId: number | null = null;
    let rootResponseId: number | null = null;
    if (parentRef) {
        const parent = await formRepo.getResponseById(parentRef.parentResponseId);
        // Only honour the link if the parent exists AND the two forms are actually related.
        const relation = parent ? await formRepo.getRelation(parent.formId, formId) : null;
        if (parent && relation) {
            // one_to_one / one_to_zero: a parent response may have at most one child response here.
            const isUniqueChild = relation.type === "one_to_one" || relation.type === "one_to_zero";
            if (isUniqueChild && (await formRepo.hasChildInForm(parent.id, formId))) {
                throw new Error("Este formulario ya fue respondido para este registro.");
            }
            parentResponseId = parent.id;
            parentFormId = parent.formId;
            rootResponseId = parentRef.rootResponseId || parent.id;
        }
    }

    // Second link for many-to-many bridge responses (the "other side").
    let secondaryResponseId: number | null = null;
    const secondRef = verifyRefToken(ref2);
    if (secondRef) {
        const secondary = await formRepo.getResponseById(secondRef.parentResponseId);
        if (secondary) secondaryResponseId = secondary.id;
    }

    // UNIQUE constraint: reject if any field flagged `meta.unique` already holds this
    // value in another response of the same form (case-insensitive, trimmed).
    const uniqueFields = ((form as any).fields || []).filter((f: any) => f?.meta?.unique === true);
    if (uniqueFields.length) {
        const existing = await formRepo.getFormResponses(formId);
        for (const uf of uniqueFields) {
            const val = (answers as Record<string, any>)?.[uf.name];
            if (val === undefined || val === null || String(val).trim() === "") continue;
            const norm = String(val).trim().toLowerCase();
            const clash = existing.some((r) => {
                const ev = (r.answers || {})[uf.name];
                return ev != null && String(ev).trim().toLowerCase() === norm;
            });
            if (clash) {
                const err: any = new Error(`Ya existe un registro con ${uf.label || uf.name} "${val}". Ese campo debe ser único.`);
                err.code = "UNIQUE_VIOLATION";
                throw err;
            }
        }
    }

    const response = await formRepo.createFormResponse({
        formId,
        respondentId,
        respondentName,
        respondentEmail,
        respondentData: respondentData || null,
        answers,
        parentResponseId,
        parentFormId,
        rootResponseId,
        secondaryResponseId,
    });

    // Offer links to continue into related forms (root = this response when it starts a chain).
    const childForms = await buildChildLinks(formId, response.id, rootResponseId ?? response.id);

    return { response, childForms };
};

/**
 * Returns the shareable `?ref=` links into each child form for an *existing* response.
 * Lets the owner copy a link tied to one specific parent record and send it to whoever
 * should fill the nested form — the submission stays chained to this response/session.
 * Owner or collaborator only.
 */
export const getChildLinksForResponse = async (
    formId: number,
    responseId: number,
    userId: number,
    userEmail?: string,
): Promise<ChildFormLink[]> => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab) throw new Error("Unauthorized");
    }

    const response = await formRepo.getResponseById(responseId);
    if (!response || response.formId !== formId) throw new Error("Response not found");

    // Keep the chain anchored to the original root so deep chains (A→B→C) stay linked.
    const rootResponseId = response.rootResponseId ?? response.id;
    return await buildChildLinks(formId, response.id, rootResponseId);
};

/**
 * Returns a form's existing records as selectable options for a foreign-key field
 * in another form. value = the response id (the FK that gets stored), label = the
 * chosen answer field (falls back to the first non-empty answer, then respondent
 * name, then #id). Used by `optionsSource.formId` selects.
 */
export const getFormOptions = async (
    formId: number,
    labelField?: string,
): Promise<{ value: string; label: string }[]> => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");
    const responses = await formRepo.getFormResponses(formId);
    return responses.map((r) => {
        const answers: Record<string, any> = r.answers || {};
        let label: any = labelField ? answers[labelField] : undefined;
        if (label === undefined || label === null || label === "") {
            const firstVal = Object.values(answers).find((v) => v !== null && v !== undefined && v !== "");
            label = firstVal ?? r.respondentName ?? `#${r.id}`;
        }
        if (Array.isArray(label)) label = label.join(", ");
        return { value: String(r.id), label: String(label) };
    });
};

// ─── Form relations (chain) ───
export const getFormRelations = async (projectId: number) => {
    return await formRepo.getProjectRelations(projectId);
};

const RELATION_TYPES = ["one_to_one", "one_to_many", "many_to_many"];

export const saveFormRelations = async (
    projectId: number,
    validFormIds: Set<number>,
    relations: { parentFormId: number; childFormId: number; keyField?: string | null; type?: string; joinFormId?: number | null }[],
) => {
    const clean = (Array.isArray(relations) ? relations : [])
        .map((r) => {
            const type = RELATION_TYPES.includes(r.type as string) ? (r.type as string) : "one_to_many";
            // The bridge form is only meaningful for many-to-many, and must belong to the project.
            const joinFormId =
                type === "many_to_many" && r.joinFormId != null && validFormIds.has(Number(r.joinFormId))
                    ? Number(r.joinFormId)
                    : null;
            return {
                parentFormId: Number(r.parentFormId),
                childFormId: Number(r.childFormId),
                keyField: r.keyField ?? null,
                type,
                joinFormId,
            };
        })
        .filter((r) =>
            validFormIds.has(r.parentFormId) &&
            validFormIds.has(r.childFormId) &&
            r.parentFormId !== r.childFormId,
        );
    return await formRepo.replaceProjectRelations(projectId, clean);
};

export const nullifyResponseFields = async (
    formId: number,
    userId: number,
    fieldNames: string[],
    userEmail?: string,
): Promise<number> => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab) throw new Error("Unauthorized");
    }
    const responses = await formRepo.getFormResponses(formId);
    let updated = 0;
    for (const resp of responses) {
        const answers = { ...(resp.answers || {}) };
        let changed = false;
        for (const key of fieldNames) {
            if (key in answers) { answers[key] = null; changed = true; }
        }
        if (changed) { await resp.update({ answers }); updated++; }
    }
    return updated;
};

export const countFormResponses = async (formId: number, userId: number, userEmail?: string): Promise<number> => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab) throw new Error("Unauthorized");
    }
    return await formRepo.countFormResponses(formId);
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

/**
 * Builds the response chain tree for a form: each of this form's responses as a
 * top node, with descendant responses (from related child forms) nested under
 * it via parentResponseId. Returns the involved forms' fields/titles so the UI
 * can render any node's answers, plus parent breadcrumbs when this form is a child.
 */
export const getResponseChain = async (formId: number, userId: number, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    // Owner or collaborator can view (same rule as plain responses)
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab) throw new Error("Unauthorized");
    }

    const roots = await formRepo.getFormResponses(formId);
    const rootIds = new Set(roots.map((r) => r.id));

    // Walk down the chain level by level, collecting every descendant response.
    const all: any[] = roots.map((r) => r.get({ plain: true }));
    const seen = new Set(all.map((r) => r.id));
    let frontier = roots.map((r) => r.id);
    while (frontier.length) {
        const children = await formRepo.getResponsesByParentIds(frontier);
        const fresh = children.map((c) => c.get({ plain: true })).filter((c) => !seen.has(c.id));
        if (!fresh.length) break;
        fresh.forEach((c) => { seen.add(c.id); all.push(c); });
        frontier = fresh.map((c) => c.id);
    }

    // Parent breadcrumbs (when this form's responses descend from another form)
    const parentIds = [...new Set(all.map((r) => r.parentResponseId).filter((pid): pid is number => !!pid && !seen.has(pid)))];
    const parentRows = await formRepo.getResponsesByIds(parentIds);
    const parents: Record<number, any> = {};
    parentRows.forEach((p) => {
        const r = p.get({ plain: true });
        parents[r.id] = { id: r.id, formId: r.formId, respondentName: r.respondentName, respondentEmail: r.respondentEmail, createdAt: r.createdAt };
    });

    // Involved forms (descendants + this form + parent forms) → fields/titles for rendering
    const formIds = [...new Set([
        ...all.map((r) => r.formId),
        ...parentRows.map((p) => p.get({ plain: true }).formId),
    ])];
    const formRows = await formRepo.getFormsByIds(formIds);
    const forms: Record<number, any> = {};
    formRows.forEach((f) => {
        if (!f) return;
        forms[f.id] = {
            id: f.id,
            title: f.title,
            fields: (f.fields || [])
                .filter((ff: any) => !ff.name?.startsWith("__page_break_"))
                .map((ff: any) => ({ name: ff.name, label: ff.label, type: ff.type, componentType: ff.componentType, options: ff.options })),
        };
    });

    // Assemble the tree
    const childrenByParent = new Map<number, any[]>();
    all.forEach((r) => {
        if (r.parentResponseId) {
            const arr = childrenByParent.get(r.parentResponseId) || [];
            arr.push(r);
            childrenByParent.set(r.parentResponseId, arr);
        }
    });
    const toNode = (r: any): any => ({ ...r, children: (childrenByParent.get(r.id) || []).map(toNode) });
    const tree = all.filter((r) => rootIds.has(r.id)).map(toNode);

    return { forms, parents, tree };
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

// ─── Partial styles patch (merge into existing styles JSONB) ───
export const patchFormStyles = async (formId: number, userId: number, patch: Record<string, any>, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab || collab.role !== "editor") throw new Error("Unauthorized");
    }
    return await formRepo.updateFormStyles(formId, patch);
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

export const saveDashboardLayout = async (formId: number, userId: number, layout: Record<string, any>, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    // Owner or editor collaborator can change the dashboard layout
    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab || collab.role !== "editor") throw new Error("Unauthorized");
    }

    return await formRepo.updateFormStyles(formId, { dashboardLayout: layout });
};
