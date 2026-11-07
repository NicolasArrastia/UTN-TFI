import { Router } from "express";
import { listCategories } from "../controllers/category.controller.ts";
import { authenticate } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(authenticate);

router.get("/", listCategories);

export default router;
