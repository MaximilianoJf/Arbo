import { Router } from "express";
import { verifyToken } from "../middleware";
import { verifyApiKey } from "../middleware/apikey.middleware";
import {
    createApiKey, listApiKeys, revokeApiKey, deleteApiKey,
    getFormsList, getFormData,
    createFormViaApi, updateFormViaApi, publishFormViaApi, deleteFormViaApi,
} from "../handlers/apikey.handler";

const router = Router();

// ─── API Key management (JWT auth) ───
router.post("/", verifyToken, createApiKey);
router.get("/", verifyToken, listApiKeys);
router.patch("/:keyId/revoke", verifyToken, revokeApiKey);
router.delete("/:keyId", verifyToken, deleteApiKey);

// ─── Data API (API Key auth) — read ───
router.get("/data/forms", verifyApiKey, getFormsList);
router.get("/data/forms/:formId", verifyApiKey, getFormData);

// ─── Data API (API Key auth) — write ───
router.post("/data/forms", verifyApiKey, createFormViaApi);
router.put("/data/forms/:formId", verifyApiKey, updateFormViaApi);
router.patch("/data/forms/:formId/publish", verifyApiKey, publishFormViaApi);
router.delete("/data/forms/:formId", verifyApiKey, deleteFormViaApi);

export default router;
