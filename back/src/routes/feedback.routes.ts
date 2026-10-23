import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as FeedbackController from "../controllers/feedback.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// POST /api/feedbacks  — public
router.post("/", controllerWrapper(FeedbackController.create));

// GET /api/feedbacks/admin  — admin
router.get("/admin", authenticate, controllerWrapper(FeedbackController.getAll));

// PATCH /api/feedbacks/admin/mark-read  — admin : marquer tous les feedbacks comme lus
router.patch("/admin/mark-read", authenticate, controllerWrapper(FeedbackController.markAllRead));

// DELETE /api/feedbacks/admin/:id  — admin
router.delete("/admin/:id", authenticate, controllerWrapper(FeedbackController.deleteOne));

export default router;
