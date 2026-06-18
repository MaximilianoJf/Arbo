import {
    createProject,
    getUserProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addProjectCollaborator,
    removeProjectCollaborator,
    getProjectCollaborators,
    updateProjectCollaboratorRole,
    isProjectOwnerOrCollaborator,
    assignFormToProject,
} from "../repositories/project.repository";
import { getUserByEmail } from "../repositories/user.repository";

export const create = async (userId: number, input: { name: string; description?: string; color?: string }) => {
    return await createProject({ ...input, userId });
};

export const getAll = async (userId: number, email: string) => {
    return await getUserProjects(userId, email);
};

export const getById = async (id: number, userId: number, email: string) => {
    const { hasAccess } = await isProjectOwnerOrCollaborator(id, userId, email);
    if (!hasAccess) throw new Error("Access denied");
    return await getProjectById(id);
};

export const update = async (id: number, userId: number, input: { name?: string; description?: string; color?: string }) => {
    const project = await getProjectById(id);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Only the owner can update the project");
    return await updateProject(id, input);
};

export const remove = async (id: number, userId: number) => {
    const project = await getProjectById(id);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Only the owner can delete the project");
    await deleteProject(id);
};

// --- Collaborators ---
export const addCollab = async (projectId: number, userId: number, email: string, role: string) => {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Only the owner can add collaborators");
    return await addProjectCollaborator(projectId, email, role);
};

export const removeCollab = async (projectId: number, userId: number, email: string) => {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Only the owner can remove collaborators");
    return await removeProjectCollaborator(projectId, email);
};

export const getCollabs = async (projectId: number, userId: number, email: string) => {
    const { hasAccess } = await isProjectOwnerOrCollaborator(projectId, userId, email);
    if (!hasAccess) throw new Error("Access denied");
    return await getProjectCollaborators(projectId);
};

export const updateCollabRole = async (projectId: number, userId: number, email: string, role: string) => {
    const project = await getProjectById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Only the owner can change roles");
    return await updateProjectCollaboratorRole(projectId, email, role);
};

// --- Form assignment ---
export const assignForm = async (formId: number, projectId: number | null, userId: number) => {
    // Verify user owns the form
    return await assignFormToProject(formId, projectId);
};
