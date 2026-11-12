import { Router } from "express";
import {
  createTag,
  deleteTag,
  getTag,
  listTags,
  updateTag,
} from "../controllers/tag.controller.ts";
import { authenticate, authorize } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(authenticate);

router.get("/", listTags);
router.get("/:id", getTag);
router.post("/", authorize("admin"), createTag);
router.patch("/:id", authorize("admin"), updateTag);
router.delete("/:id", authorize("admin"), deleteTag);

export default router;
