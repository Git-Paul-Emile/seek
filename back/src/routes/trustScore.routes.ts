import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as TrustScoreController from "../controllers/trustScore.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { validateId } from "../middlewares/validateId.js";

const router = Router();

/** GET /api/proprietaires/:id/score - public */
router.get(
  "/:id/score",
  validateId,
  controllerWrapper(TrustScoreController.getPublicScore)
);

export default router;

// Route owner montée séparément dans app.ts sous /api/owner
export const ownerScoreRouter = Router();
ownerScoreRouter.get(
  "/score",
  authenticateOwner,
  controllerWrapper(TrustScoreController.getOwnScore)
);
