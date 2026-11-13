import { Router } from "express";
import { changePassword, login, me } from "../controllers/auth.controller.ts";
import { authenticate } from "../middlewares/auth.middleware.ts";

const router = Router();

router.post("/login", login);
router.get("/me", authenticate, me);
router.patch("/change-password", authenticate, changePassword);

export default router;
