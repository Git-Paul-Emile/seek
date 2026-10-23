import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as MonetisationController from "../controllers/monetisation.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// ─── Admin : Config ───────────────────────────────────────────────────────────
router.get("/admin/config", authenticate, controllerWrapper(MonetisationController.getConfigHandler));
router.put("/admin/config", authenticate, controllerWrapper(MonetisationController.updateConfigHandler));

export default router;
