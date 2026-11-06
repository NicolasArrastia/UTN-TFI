import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.ts";
import { authenticate, authorize } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(authenticate);

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", authorize("admin"), createProduct);
router.patch("/:id", authorize("admin"), updateProduct);
router.delete("/:id", authorize("admin"), deleteProduct);

export default router;
