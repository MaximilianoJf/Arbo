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
    getFormOptions,
    checkMyResponse,
    getFormResponseCount,
    nullifyResponseFields,
    getFormResponses,
    getResponseChain,
    deleteFormResponse,
    savePdfLayout,
    saveDashboardLayout,
    patchFormStyles,
} from "../handlers/form.handler";
import { exportExcel, exportPdf, exportSingleResponsePdf, previewSingleResponsePdf } from "../handlers/export.handler";
import { analyzeFormResponses } from "../handlers/analysis.handler";
import { generateDashboard } from "../handlers/dashboard.handler";
import { generatePowerBi } from "../handlers/powerbi.handler";
import { handleAIChat } from "../handlers/ai-chat.handler";
import { handleAIScan } from "../handlers/ai-scan.handler";
import { verifyTokenOrApiKey, optionalAuth } from "../middleware/auth.middleware";
import { aiLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// ─── AI Chat (form builder assistant) — must be before /:id routes ───
router.post("/ai/chat", aiLimiter, verifyToken, handleAIChat);
// ─── AI Scan (photo of a form → schema) ───
router.post("/ai/scan", aiLimiter, verifyToken, handleAIScan);

// ─── Form CRUD ───
router.post("/", verifyToken, createFormValidator, handleInpputErrors, createForm);
router.get("/", verifyToken, getUserForms);
router.get("/archived", verifyToken, getArchivedForms);
router.get("/trash", verifyToken, getTrashedForms);
router.get("/shared", verifyToken, getSharedForms);

router.get("/slug/:slug", optionalAuth, formSlugValidator, handleInpputErrors, getFormBySlug);
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

// ─── Foreign-key options (another form's records as selectable options) ───
router.get("/:id/options", optionalAuth, formIdValidator, handleInpputErrors, getFormOptions);

// ─── Responses ───
router.get("/:id/responses/mine", optionalAuth, formIdValidator, handleInpputErrors, checkMyResponse);
router.get("/:id/responses/count", verifyToken, formIdValidator, handleInpputErrors, getFormResponseCount);
router.patch("/:id/responses/nullify-fields", verifyToken, formIdValidator, handleInpputErrors, nullifyResponseFields);
router.post("/:id/responses", optionalAuth, submitResponseValidator, handleInpputErrors, submitResponse);
router.get("/:id/responses", verifyTokenOrApiKey, formIdValidator, handleInpputErrors, getFormResponses);
router.get("/:id/responses/chain", verifyToken, formIdValidator, handleInpputErrors, getResponseChain);
router.delete("/:id/responses/:responseId", verifyToken, formIdValidator, handleInpputErrors, deleteFormResponse);
router.get("/:id/responses/:responseId/export/pdf", verifyToken, formIdValidator, handleInpputErrors, exportSingleResponsePdf);
router.post("/:id/responses/:responseId/preview-pdf", verifyToken, formIdValidator, handleInpputErrors, previewSingleResponsePdf);

// ─── Partial styles patch (merges into existing JSONB) ───
router.patch("/:id/styles", verifyToken, formIdValidator, handleInpputErrors, patchFormStyles);

// ─── PDF layout config ───
router.put("/:id/pdf-layout", verifyToken, formIdValidator, handleInpputErrors, savePdfLayout);

// ─── Dashboard layout config ───
router.put("/:id/dashboard-layout", verifyToken, formIdValidator, handleInpputErrors, saveDashboardLayout);

// ─── Export ───
router.get("/:id/export/excel", verifyToken, formIdValidator, handleInpputErrors, exportExcel);
router.get("/:id/export/pdf", verifyToken, formIdValidator, handleInpputErrors, exportPdf);

// ─── AI Analysis ───
router.post("/:id/analyze", verifyToken, formIdValidator, handleInpputErrors, analyzeFormResponses);

// ─── AI Dashboard ───
router.post("/:id/generate-dashboard", verifyToken, formIdValidator, handleInpputErrors, generateDashboard);

// ─── AI Power BI project (.pbip) ───
router.post("/:id/generate-powerbi", verifyToken, formIdValidator, handleInpputErrors, generatePowerBi);

export default router;
