import { Router } from "express";

import projectsRoutes from "./project.routes";
import ownerRoutes from "./owner.routes";

const router = Router();

router.use("/projects", projectsRoutes);
router.use("/owners", ownerRoutes);

export default router;