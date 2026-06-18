import { Router } from "express";
import { verifyToken } from "../middleware";
import { handleInpputErrors } from "../middleware";
import {
    createFormValidator,
    updateFormValidator,
    formIdValidator,
    formSlugValidator,
    submitResponseValidator,
} from "../validators/form.validator";
import {
    createForm,
    getUserForms,
    getArchivedForms,
    getTrashedForms,
    getFormById,
    getFormBySlug,
    updateForm,
    deleteForm,
    restoreForm,
    permanentDeleteForm,
    archiveForm,
    unarchiveForm,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    getCollaborators,
    getSharedForms,
    submitResponse,
    getFormResponses,
    deleteFormResponse,
    savePdfLayout,
} from "../handlers/form.handler";
import { exportExcel, exportPdf, exportSingleResponsePdf, previewSingleResponsePdf } from "../handlers/export.handler";
import { analyzeFormResponses } from "../handlers/analysis.handler";
import { handleAIChat } from "../handlers/ai-chat.handler";

const router = Router();

// ─── AI Chat (form builder assistant) — must be before /:id routes ───
router.post("/ai/chat", verifyToken, handleAIChat);

// ─── Form CRUD ───
router.post("/", verifyToken, createFormValidator, handleInpputErrors, createForm);
router.get("/", verifyToken, getUserForms);
router.get("/archived", verifyToken, getArchivedForms);
router.get("/trash", verifyToken, getTrashedForms);
router.get("/shared", verifyToken, getSharedForms);

router.get("/slug/:slug", formSlugValidator, handleInpputErrors, getFormBySlug);
router.get("/:id", formIdValidator, handleInpputErrors, getFormById);
router.put("/:id", verifyToken, updateFormValidator, handleInpputErrors, updateForm);
router.delete("/:id", verifyToken, formIdValidator, handleInpputErrors, deleteForm);

// ─── Archive & Trash ───
router.post("/:id/archive", verifyToken, formIdValidator, handleInpputErrors, archiveForm);
router.post("/:id/unarchive", verifyToken, formIdValidator, handleInpputErrors, unarchiveForm);
router.post("/:id/restore", verifyToken, formIdValidator, handleInpputErrors, restoreForm);
router.delete("/:id/permanent", verifyToken, formIdValidator, handleInpputErrors, permanentDeleteForm);

// ─── Collaborators ───
router.get("/:id/collaborators", verifyToken, formIdValidator, handleInpputErrors, getCollaborators);
router.post("/:id/collaborators", verifyToken, formIdValidator, handleInpputErrors, addCollaborator);
router.delete("/:id/collaborators/:email", verifyToken, formIdValidator, handleInpputErrors, removeCollaborator);
router.patch("/:id/collaborators/:email", verifyToken, formIdValidator, handleInpputErrors, updateCollaboratorRole);

// ─── Responses ───
router.post("/:id/responses", submitResponseValidator, handleInpputErrors, submitResponse);
router.get("/:id/responses", verifyToken, formIdValidator, handleInpputErrors, getFormResponses);
router.delete("/:id/responses/:responseId", verifyToken, formIdValidator, handleInpputErrors, deleteFormResponse);
router.get("/:id/responses/:responseId/export/pdf", verifyToken, formIdValidator, handleInpputErrors, exportSingleResponsePdf);
router.post("/:id/responses/:responseId/preview-pdf", verifyToken, formIdValidator, handleInpputErrors, previewSingleResponsePdf);

// ─── PDF layout config ───
router.put("/:id/pdf-layout", verifyToken, formIdValidator, handleInpputErrors, savePdfLayout);

// ─── Export ───
router.get("/:id/export/excel", verifyToken, formIdValidator, handleInpputErrors, exportExcel);
router.get("/:id/export/pdf", verifyToken, formIdValidator, handleInpputErrors, exportPdf);

// ─── AI Analysis ───
router.post("/:id/analyze", verifyToken, formIdValidator, handleInpputErrors, analyzeFormResponses);

export default router;
