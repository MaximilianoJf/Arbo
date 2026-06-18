import { Router } from "express";

import userRoutes from "./user.routes";
import authRoutes from "./auth.routes";
import formRoutes from "./form.routes";
import projectRoutes from "./project.routes";
import apikeyRoutes from "./apikey.routes";
import settingsRoutes from "./settings.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/forms", formRoutes);
router.use("/projects", projectRoutes);
router.use("/api-keys", apikeyRoutes);
router.use("/settings", settingsRoutes);

export default router;
