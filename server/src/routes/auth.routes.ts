import { Router } from "express";
import { loginValidator, registerValidator } from "../validators/auth.validator";
import { handleInpputErrors } from "../middleware";
import { register, login, profile, googleCallback } from "../handlers/auth.handler";
import { verifyToken } from "../middleware";
import { authLimiter } from "../middleware/rate-limit.middleware";


const router = Router();

router.post("/register", authLimiter, registerValidator, handleInpputErrors, register);
router.post("/login", authLimiter, loginValidator, handleInpputErrors, login);
router.post("/google", authLimiter, googleCallback);
router.get("/profile", verifyToken, profile);

export default router;
