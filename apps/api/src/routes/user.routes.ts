import { Router } from "express";
import { createUser } from "../controllers/user.controller.ts";
import { authenticate, authorize } from "../middlewares/auth.middleware.ts";

const router = Router();

router.post("/", authenticate, authorize("admin"), createUser);

export default router;
