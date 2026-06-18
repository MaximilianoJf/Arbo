import { Router } from "express";
import { verifyToken } from "../middleware";
import {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    addCollaborator,
    removeCollaborator,
    getCollaborators,
    updateCollaboratorRole,
    assignFormToProject,
} from "../handlers/project.handler";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// CRUD
router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Collaborators
router.get("/:id/collaborators", getCollaborators);
router.post("/:id/collaborators", addCollaborator);
router.delete("/:id/collaborators/:email", removeCollaborator);
router.patch("/:id/collaborators/:email", updateCollaboratorRole);

// Form assignment
router.post("/assign-form", assignFormToProject);

export default router;
