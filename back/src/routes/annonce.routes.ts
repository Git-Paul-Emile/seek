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

/** PATCH /api/annonces/:id/retirer - retirer une annonce publiée, avec une note (admin) */
router.patch(
  "/:id/retirer",
  authenticate,
  validateId,
  controllerWrapper(AnnonceController.retirerAnnonce)
);

/** PATCH /api/annonces/:id/republier - remettre en ligne une annonce retirée ou rejetée (admin) */
router.patch(
  "/:id/republier",
  authenticate,
  validateId,
  controllerWrapper(AnnonceController.republierAnnonce)
);

/** PATCH /api/annonces/:id - corriger le titre, la description ou le prix (admin) */
router.patch(
  "/:id",
  authenticate,
  validateId,
  controllerWrapper(AnnonceController.modifierAnnonce)
);

/** DELETE /api/annonces/:id - supprimer une annonce (admin) */
router.delete(
  "/:id",
  authenticate,
  validateId,
  controllerWrapper(AnnonceController.deleteAnnonce)
);

export default router;
