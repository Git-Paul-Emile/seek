import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as SuspensionController from "../controllers/suspension.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// ─── Routes liste des propriétaires ─────────────────────────────────────────

/**
 * GET /api/suspension/proprietaires
 * Protégé : nécessite un access token admin
 * Query: ?estSuspendu=true|false&search=terme
 */
router.get(
  "/proprietaires",
  authenticate,
  controllerWrapper(SuspensionController.getProprietaires)
);

/**
 * GET /api/suspension/proprietaires/:id/details
 * Protégé : nécessaire un access token admin
 * Retourne les détails du propriétaire avec ses biens
 * NOTE: Cette route doit être définie AVANT /proprietaires/:id pour éviter les conflits
 */
router.get(
  "/proprietaires/:id/details",
  authenticate,
  controllerWrapper(SuspensionController.getProprietaireWithBiens)
);

/**
 * GET /api/suspension/proprietaires/:id
 * Protégé : nécessite un access token admin
 */
router.get(
  "/proprietaires/:id",
  authenticate,
  controllerWrapper(SuspensionController.getProprietaireById)
);

// ─── Routes Propriétaire ───────────────────────────────────────────────────────

/**
 * POST /api/suspension/proprietaire/:id/suspendre
 * Protégé : nécessite un access token admin
 * Body: { motif: string, masquerAnnonces?: boolean }
 */
router.post(
  "/proprietaire/:id/suspendre",
  authenticate,
  controllerWrapper(SuspensionController.suspendreProprietaire)
);

/**
 * POST /api/suspension/proprietaire/:id/reactiver
 * Protégé : nécessite un access token admin
 * Body: { afficherAnnonces?: boolean }
 */
router.post(
  "/proprietaire/:id/reactiver",
  authenticate,
  controllerWrapper(SuspensionController.reactiverProprietaire)
);

/**
 * GET /api/suspension/proprietaire/:id/statut
 * Protégé : nécessite un access token admin
 */
router.get(
  "/proprietaire/:id/statut",
  authenticate,
  controllerWrapper(SuspensionController.getStatutSuspensionProprietaire)
);

// ─── Routes Locataire ───────────────────────────────────────────────────────────

/**
 * POST /api/suspension/locataire/:id/suspendre
 * Protégé : nécessite un access token admin
 * Body: { motif: string }
 */
router.post(
  "/locataire/:id/suspendre",
  authenticate,
  controllerWrapper(SuspensionController.suspendreLocataire)
);

/**
 * POST /api/suspension/locataire/:id/reactiver
 * Protégé : nécessite un access token admin
 */
router.post(
  "/locataire/:id/reactiver",
  authenticate,
  controllerWrapper(SuspensionController.reactiverLocataire)
);

/**
 * GET /api/suspension/locataire/:id/statut
 * Protégé : nécessite un access token admin
 */
router.get(
  "/locataire/:id/statut",
  authenticate,
  controllerWrapper(SuspensionController.getStatutSuspensionLocataire)
);

// ─── Routes liste des locataires ─────────────────────────────────────────

/**
 * GET /api/suspension/locataires
 * Protégé : nécessite un access token admin
 * Query: ?estSuspendu=true|false&search=terme
 */
router.get(
  "/locataires",
  authenticate,
  controllerWrapper(SuspensionController.getLocataires)
);

/**
 * GET /api/suspension/locataires/:id/details
 * Protégé : nécessaire un access token admin
 * Retourne les détails du locataire avec ses baux
 * NOTE: Cette route doit être définie AVANT /locataires/:id pour éviter les conflits
 */
router.get(
  "/locataires/:id/details",
  authenticate,
  controllerWrapper(SuspensionController.getLocataireWithBails)
);

/**
 * GET /api/suspension/locataires/:id
 * Protégé : nécessite un access token admin
 */
router.get(
  "/locataires/:id",
  authenticate,
  controllerWrapper(SuspensionController.getLocataireById)
);

/**
 * DELETE /api/suspension/proprietaires/:id
 * Protégé : nécessite un access token admin
 */
router.delete(
  "/proprietaires/:id",
  authenticate,
  controllerWrapper(SuspensionController.supprimerProprietaire)
);

/**
 * DELETE /api/suspension/locataires/:id
 * Protégé : nécessite un access token admin
 */
router.delete(
  "/locataires/:id",
  authenticate,
  controllerWrapper(SuspensionController.supprimerLocataire)
);

/**
 * GET /api/suspension/locataires/:id/documents
 * Locataire avec documents de vérification
 */
router.get(
  "/locataires/:id/documents",
  authenticate,
  controllerWrapper(SuspensionController.getLocataireAvecDocuments)
);

export default router;
