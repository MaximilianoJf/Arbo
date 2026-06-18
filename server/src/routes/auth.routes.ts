import { Router } from "express";
import { loginValidator, registerValidator } from "../validators/auth.validator";
import { handleInpputErrors } from "../middleware";
import { register, login, profile, googleCallback } from "../handlers/auth.handler";
import { verifyToken } from "../middleware";


const router = Router();

router.post("/register", registerValidator, handleInpputErrors, register);
router.post("/login", loginValidator, handleInpputErrors, login);
router.post("/google", googleCallback);
router.get("/profile", verifyToken, profile);

export default router;
