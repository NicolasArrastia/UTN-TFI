import { Router } from "express";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../controllers/user.controller.ts";
import { authenticate, authorize } from "../middlewares/auth.middleware.ts";

const router: Router = Router();

router.use(authenticate);

router.get("/", authorize("admin"), listUsers);
router.post("/", authorize("admin"), createUser);
router.patch("/:id", authorize("admin"), updateUser);
router.delete("/:id", authorize("admin"), deleteUser);

export default router;
