import { Router } from "express";
import { getOverview, getStats } from "../controllers/stats.controller.ts";
import { authenticate, authorize } from "../middlewares/auth.middleware.ts";

const router: Router = Router();

router.use(authenticate, authorize("admin", "employee"));

router.get("/", getStats);
router.get("/overview", getOverview);

export default router;
