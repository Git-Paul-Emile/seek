import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as AnnonceController from "../controllers/annonce.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateId } from "../middlewares/validateId.js";

const router = Router();

/** GET /api/annonces/count-pending - nombre d'annonces en attente (admin) */
router.get(
  "/count-pending",
  authenticate,
  controllerWrapper(AnnonceController.countPending)
);

/** GET /api/annonces/counts - nombre d'annonces par statut (admin) */
router.get(
  "/counts",
  authenticate,
  controllerWrapper(AnnonceController.getCounts)
);

/** GET /api/annonces - liste des annonces avec filtres (admin) */
router.get(
  "/",
  authenticate,
  controllerWrapper(AnnonceController.getAnnonces)
);

/** PATCH /api/annonces/:id/valider - approuver / rejeter / mettre en révision (admin) */
router.patch(
  "/:id/valider",
  authenticate,
  validateId,
  controllerWrapper(AnnonceController.validerAnnonce)
);

/** DELETE /api/annonces/:id - supprimer une annonce (admin) */
router.delete(
  "/:id",
  authenticate,
  validateId,
  controllerWrapper(AnnonceController.deleteAnnonce)
);

export default router;
