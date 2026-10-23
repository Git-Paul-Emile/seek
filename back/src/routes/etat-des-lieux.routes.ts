import { Router } from "express";
import * as EtatDesLieuxController from "../controllers/etat-des-lieux.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { authenticateLocataire } from "../middlewares/locataireAuth.middleware.js";
import { uploadImageMiddleware } from "../middlewares/upload.middleware.js";

const router = Router();

// ========================
// Routes Propriétaire - GET (spécifiques d'abord)
// ========================
router.get(
  "/owner/bail/:bailId/comparison",
  authenticateOwner,
  EtatDesLieuxController.compareOwner
);

router.get(
  "/owner/bail/:bailId/context",
  authenticateOwner,
  EtatDesLieuxController.getCreationContextOwner
);

router.get(
  "/owner/bail/:bailId",
  authenticateOwner,
  EtatDesLieuxController.getByBailOwner
);

router.get(
  "/owner/:id",
  authenticateOwner,
  EtatDesLieuxController.getByIdOwner
);

// ========================
// Routes Propriétaire - Autres (POST, PUT, DELETE)
// ========================
router.post(
  "/upload",
  authenticateOwner,
  uploadImageMiddleware,
  EtatDesLieuxController.uploadImage
);

router.post(
  "/",
  authenticateOwner,
  EtatDesLieuxController.create
);

router.put(
  "/:id",
  authenticateOwner,
  EtatDesLieuxController.update
);

router.post(
  "/:id/submit",
  authenticateOwner,
  EtatDesLieuxController.submit
);

router.delete(
  "/:id",
  authenticateOwner,
  EtatDesLieuxController.deleteBrouillon
);

router.post(
  "/:id/resoudre-contestation",
  authenticateOwner,
  EtatDesLieuxController.resoudreContestations
);

// ========================
// Routes Locataire - GET (spécifiques d'abord)
// ========================
router.get(
  "/mes-edl",
  authenticateLocataire,
  EtatDesLieuxController.getAllByLocataire
);

router.get(
  "/locataire/mes-edl",
  authenticateLocataire,
  EtatDesLieuxController.getAllByLocataire
);

router.get(
  "/locataire/bail/:bailId/comparison",
  authenticateLocataire,
  EtatDesLieuxController.compareLocataire
);

router.get(
  "/locataire/bail/:bailId",
  authenticateLocataire,
  EtatDesLieuxController.getByBailLocataire
);

router.get(
  "/locataire/:id",
  authenticateLocataire,
  EtatDesLieuxController.getByIdLocataire
);

// ========================
// Routes Locataire - Autres (POST)
// ========================
router.post(
  "/locataire/upload",
  authenticateLocataire,
  uploadImageMiddleware,
  EtatDesLieuxController.uploadImage
);

router.post(
  "/locataire/:id/contester",
  authenticateLocataire,
  EtatDesLieuxController.contester
);

router.post(
  "/locataire/:id/validate",
  authenticateLocataire,
  EtatDesLieuxController.validate
);

export default router;
