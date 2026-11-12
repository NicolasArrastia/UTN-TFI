import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.ts";
import { authenticate, authorize } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(authenticate);

router.get("/", listCategories);
router.get("/:id", getCategory);
router.post("/", authorize("admin"), createCategory);
router.patch("/:id", authorize("admin"), updateCategory);
router.delete("/:id", authorize("admin"), deleteCategory);

export default router;
