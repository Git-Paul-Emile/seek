import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as ModeleContratController from "../controllers/modeleContrat.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { validateId } from "../middlewares/validateId.js";

const router = Router();

/** GET /api/modeles-contrat - owner : modèles actifs pour choisir un template */
router.get("/", authenticateOwner, controllerWrapper(ModeleContratController.getActifs));

/** GET /api/modeles-contrat/admin - admin : liste complète avec pagination */
router.get("/admin", authenticate, controllerWrapper(ModeleContratController.getAll));

/** POST /api/modeles-contrat - admin : créer un modèle */
router.post("/", authenticate, controllerWrapper(ModeleContratController.create));

/** PATCH /api/modeles-contrat/:id - admin : modifier un modèle */
router.patch("/:id", authenticate, validateId, controllerWrapper(ModeleContratController.update));

/** DELETE /api/modeles-contrat/:id - admin : supprimer un modèle */
router.delete("/:id", authenticate, validateId, controllerWrapper(ModeleContratController.remove));

export default router;
