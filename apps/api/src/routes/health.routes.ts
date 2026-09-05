import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.ts";

const router = Router();

router.get("/", healthCheck);

export default router;
