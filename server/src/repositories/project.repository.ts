import Project from "../models/Project.model";
import ProjectCollaborator from "../models/ProjectCollaborator.model";
import UserForm from "../models/UserForm.model";
import FormField from "../models/FormField.model";
import User from "../models/User.model";

export const createProject = async (data: { name: string; description?: string; color?: string; userId: number }) => {
    return await Project.create(data);
};

export const getUserProjects = async (userId: number, email: string) => {
    // Own projects
    const owned = await Project.findAll({
        where: { userId },
        include: [
            { model: UserForm, attributes: ["id", "title", "slug"] },
            { model: User, attributes: ["id", "name", "email"] },
        ],
        order: [["updatedAt", "DESC"]],
    });

    // Shared projects (via ProjectCollaborator)
    const collabs = await ProjectCollaborator.findAll({
        where: { email },
        include: [{
            model: Project,
            include: [
                { model: UserForm, attributes: ["id", "title", "slug"] },
                { model: User, attributes: ["id", "name", "email"] },
            ],
        }],
    });

    const sharedProjects = collabs
        .map((c) => ({ ...c.project.get({ plain: true }), role: c.role }))
        .filter((p) => p.userId !== userId); // Exclude own projects

    return { owned: owned.map((p) => p.get({ plain: true })), shared: sharedProjects };
};

export const getProjectById = async (id: number) => {
    return await Project.findByPk(id, {
        include: [
            { model: UserForm, include: [{ model: FormField }] },
            { model: User, attributes: ["id", "name", "email"] },
        ],
    });
};

export const updateProject = async (id: number, data: { name?: string; description?: string; color?: string }) => {
    const project = await Project.findByPk(id);
    if (!project) return null;
    await project.update(data);
    return project;
};

export const deleteProject = async (id: number) => {
    // Unlink forms (set projectId to null), don't delete them
    await UserForm.update({ projectId: null }, { where: { projectId: id } });
    await ProjectCollaborator.destroy({ where: { projectId: id } });
    await Project.destroy({ where: { id } });
};

// --- Collaborators ---
export const addProjectCollaborator = async (projectId: number, email: string, role: string = "viewer") => {
    const existing = await ProjectCollaborator.findOne({ where: { projectId, email } });
    if (existing) throw new Error("Collaborator already exists");
    return await ProjectCollaborator.create({ projectId, email, role });
};

export const removeProjectCollaborator = async (projectId: number, email: string) => {
    return await ProjectCollaborator.destroy({ where: { projectId, email } });
};

export const getProjectCollaborators = async (projectId: number) => {
    return await ProjectCollaborator.findAll({
        where: { projectId },
        include: [{ model: User, attributes: ["id", "name", "email", "avatar"] }],
    });
};

export const updateProjectCollaboratorRole = async (projectId: number, email: string, role: string) => {
    const collab = await ProjectCollaborator.findOne({ where: { projectId, email } });
    if (!collab) return null;
    collab.role = role;
    await collab.save();
    return collab;
};

export const isProjectOwnerOrCollaborator = async (projectId: number, userId: number, email: string): Promise<{ hasAccess: boolean; role: string }> => {
    const project = await Project.findByPk(projectId);
    if (!project) return { hasAccess: false, role: "" };
    if (project.userId === userId) return { hasAccess: true, role: "owner" };
    const collab = await ProjectCollaborator.findOne({ where: { projectId, email } });
    if (collab) return { hasAccess: true, role: collab.role };
    return { hasAccess: false, role: "" };
};

// --- Form assignment ---
export const assignFormToProject = async (formId: number, projectId: number | null) => {
    return await UserForm.update({ projectId }, { where: { id: formId } });
};
