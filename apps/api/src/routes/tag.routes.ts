import { Router } from "express";
import { listTags } from "../controllers/tag.controller.ts";
import { authenticate } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(authenticate);

router.get("/", listTags);

export default router;
