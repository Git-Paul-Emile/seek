import { Router } from "express";
import * as TransactionController from "../controllers/transaction.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Admin
router.get("/admin", authenticate, TransactionController.getAdminHistorique);
router.get("/admin/stats", authenticate, TransactionController.getAdminStats);

// Owner
router.get("/", authenticateOwner, TransactionController.getHistorique);
router.get("/stats", authenticateOwner, TransactionController.getStats);
router.get("/:id", authenticateOwner, TransactionController.getTransactionDetail);

export default router;
