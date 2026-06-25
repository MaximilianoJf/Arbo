import { Router } from "express";
import { verifyToken } from "../middleware";
import {
    buildFormRag,
    buildProjectRag,
    queryFormRag,
    queryProjectRag,
    getFormRagStatus,
    getProjectRagStatus,
    buildUserRag,
    queryUserRag,
    getUserRagStatus,
} from "../handlers/rag.handler";

const router = Router();

router.post("/forms/:formId/build", verifyToken, buildFormRag);
router.post("/projects/:projectId/build", verifyToken, buildProjectRag);
router.post("/forms/:formId/query", verifyToken, queryFormRag);
router.post("/projects/:projectId/query", verifyToken, queryProjectRag);
router.get("/forms/:formId/status", verifyToken, getFormRagStatus);
router.get("/projects/:projectId/status", verifyToken, getProjectRagStatus);

// User-level: all standalone forms grouped together
router.post("/user/build", verifyToken, buildUserRag);
router.post("/user/query", verifyToken, queryUserRag);
router.get("/user/status", verifyToken, getUserRagStatus);

export default router;
