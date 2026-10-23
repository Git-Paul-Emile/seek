import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as BailController from "../controllers/bail.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";

const router = Router();

router.use(authenticateOwner);

/** GET /api/owner/biens/loyers-retard */
router.get("/loyers-retard", controllerWrapper(BailController.getBiensEnRetard));

/** GET /api/owner/biens/avec-bail-actif */
router.get("/avec-bail-actif", controllerWrapper(BailController.getBiensAvecBailActif));

/** GET /api/owner/biens/tableau-de-bord - chiffres clés des loyers et des biens */
router.get("/tableau-de-bord", controllerWrapper(BailController.getTableauDeBord));

export default router;
