import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.ts";

const router: Router = Router();

router.get("/", healthCheck);

export default router;
