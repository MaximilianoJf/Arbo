import { Router } from "express";
import { createProject } from "../handlers/project.handler";

const router = Router();

router.get("/", (req, res) => res.json("GET"));
router.post("/", createProject); // sin () para evitar ejecutar, necesita la funcion no el resultado
router.patch("/", (req, res) => res.json("PATCH"));
router.delete("/", (req, res) => res.json("DELETE"));
router.put("/", (req, res) => res.json("PUT"));

export default router;
