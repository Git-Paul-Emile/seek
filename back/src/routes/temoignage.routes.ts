import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as TemoignageController from "../controllers/temoignage.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/** GET /api/temoignages - public : témoignages actifs */
router.get("/", controllerWrapper(TemoignageController.getAllActifs));

/** POST /api/temoignages - public : créer un témoignage (sera inactif par défaut) */
router.post("/", controllerWrapper(TemoignageController.create));

/** GET /api/temoignages/admin - admin : tous les témoignages */
router.get("/admin", authenticate, controllerWrapper(TemoignageController.getAll));

/** PUT /api/temoignages/:id - admin : mettre à jour un témoignage */
router.put("/:id", authenticate, controllerWrapper(TemoignageController.update));

/** DELETE /api/temoignages/:id - admin : supprimer un témoignage */
router.delete("/:id", authenticate, controllerWrapper(TemoignageController.deleteOne));

export default router;
