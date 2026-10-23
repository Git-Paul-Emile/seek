import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as PageLegaleController from "../controllers/pageLegale.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/** GET /api/pages-legales/admin — admin : toutes les pages */
router.get("/admin", authenticate, controllerWrapper(PageLegaleController.getAll));

/** GET /api/pages-legales/:slug — public */
router.get("/:slug", controllerWrapper(PageLegaleController.getBySlug));

/** PUT /api/pages-legales/:slug — admin : créer/mettre à jour */
router.put("/:slug", authenticate, controllerWrapper(PageLegaleController.upsert));

export default router;
