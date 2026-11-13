import { Router } from "express";
import {
  cancelSale,
  createSale,
  getSale,
  listSaleCatalog,
  listSales,
} from "../controllers/sale.controller.ts";
import { authenticate, authorize } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(authenticate, authorize("admin", "employee"));

router.get("/", listSales);
router.get("/catalog", listSaleCatalog);
router.get("/:id", getSale);
router.post("/", createSale);
router.patch("/:id/cancel", authorize("admin"), cancelSale);

export default router;
