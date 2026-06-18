import { Router } from "express";
import { verifyToken } from "../middleware/jwt.middleware";
import {
    getMyBlocks, getPublicBlocks, createBlock, updateBlock, deleteBlock, addPublicBlock,
} from "../handlers/block.handler";

const router = Router();

// Composite component library ("bloques" de campos con lógica)
router.get("/", verifyToken, getMyBlocks);
router.get("/public", verifyToken, getPublicBlocks);
router.post("/", verifyToken, createBlock);
router.put("/:id", verifyToken, updateBlock);
router.delete("/:id", verifyToken, deleteBlock);
router.post("/:id/add", verifyToken, addPublicBlock);

export default router;
