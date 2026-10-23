import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as LocataireController from "../controllers/locataire.controller.js";
import * as BailInvitationController from "../controllers/bailInvitation.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { validateId } from "../middlewares/validateId.js";

const router = Router();

// Toutes les routes nécessitent l'authentification owner
router.use(authenticateOwner);

// ⚠️ Routes spécifiques AVANT les routes paramétrées

/** GET /api/owner/locataires/verifications/pending/count - Nombre de demandes de vérification en attente */
router.get(
  "/verifications/pending/count",
  controllerWrapper(LocataireController.getPendingVerificationsCount)
);

/** GET /api/owner/locataires/search?telephone=xxx&email=xxx - Recherche globale */
router.get(
  "/search",
  controllerWrapper(LocataireController.searchLocataireByContact)
);

/** POST /api/owner/locataires/inviter - Inviter un locataire existant (autre propriétaire) */
router.post(
  "/inviter",
  controllerWrapper(BailInvitationController.creerInvitation)
);

/** GET /api/owner/locataires */
router.get("/", controllerWrapper(LocataireController.getLocataires));

/** POST /api/owner/locataires */
router.post("/", controllerWrapper(LocataireController.createLocataire));

/** GET /api/owner/locataires/:id/lien */
router.get(
  "/:id/lien",
  validateId,
  controllerWrapper(LocataireController.getLienActivation)
);

/** GET /api/owner/locataires/:id */
router.get(
  "/:id",
  validateId,
  controllerWrapper(LocataireController.getLocataireById)
);

/** PATCH /api/owner/locataires/:id */
router.patch(
  "/:id",
  validateId,
  controllerWrapper(LocataireController.updateLocataire)
);

/** DELETE /api/owner/locataires/:id */
router.delete(
  "/:id",
  validateId,
  controllerWrapper(LocataireController.deleteLocataire)
);

/** POST /api/owner/locataires/:id/verification/approve - Approuver la vérification du locataire */
router.post(
  "/:id/verification/approve",
  validateId,
  controllerWrapper(LocataireController.approveLocataireVerification)
);

/** POST /api/owner/locataires/:id/verification/reject - Rejeter la vérification du locataire */
router.post(
  "/:id/verification/reject",
  validateId,
  controllerWrapper(LocataireController.rejectLocataireVerification)
);

export default router;
