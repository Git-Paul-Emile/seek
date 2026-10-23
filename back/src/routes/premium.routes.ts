import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as PremiumController from "../controllers/premium.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateId } from "../middlewares/validateId.js";

const router = Router();

// ─── Public ──────────────────────────────────────────────────────────────────

/**
 * GET /api/premium/formules - Formules de mise en avant + moyens de paiement
 */
router.get("/formules", controllerWrapper(PremiumController.getFormulesPremium));

/**
 * GET /api/premium/paiements - Moyens de paiement disponibles
 */
router.get("/paiements", controllerWrapper(PremiumController.getMoyensPaiement));

/**
 * GET /api/premium/accueil - Annonces mises en avant pour la page d'accueil
 */
router.get("/accueil", controllerWrapper(PremiumController.getAnnoncesMiseEnAvant));

/**
 * GET /api/premium/places - État des places de mise en avant disponibles (5 max)
 */
router.get("/places", controllerWrapper(PremiumController.getPlacesDisponibles));

// ─── Admin (déclarées avant les routes /:id/* du propriétaire pour éviter toute
// collision de routing, ex. /admin/historique vs /:id/historique) ─────────────

router.get("/admin/formules", authenticate, controllerWrapper(PremiumController.adminGetFormules));
router.post("/admin/formules", authenticate, controllerWrapper(PremiumController.adminCreateFormule));
router.put("/admin/formules/:id", authenticate, controllerWrapper(PremiumController.adminUpdateFormule));
router.delete("/admin/formules/:id", authenticate, controllerWrapper(PremiumController.adminDeleteFormule));

router.get("/admin/historique", authenticate, controllerWrapper(PremiumController.getAdminHistoriquePromotions));
router.get("/admin/stats", authenticate, controllerWrapper(PremiumController.getAdminStatsPromotions));
router.post("/admin/:id/arreter", authenticate, validateId, controllerWrapper(PremiumController.adminArreterPromotion));
router.post("/admin/traiter-expires", authenticate, controllerWrapper(PremiumController.adminTraiterExpires));

// ─── Propriétaire ────────────────────────────────────────────────────────────

/**
 * GET /api/premium/:id/statut - Statut de mise en avant d'un bien
 */
router.get("/:id/statut", authenticateOwner, validateId, controllerWrapper(PremiumController.getPromotionStatus));

/**
 * POST /api/premium/:id/payer - Vérifie la place disponible, simule le paiement
 * d'une formule et active la mise en avant
 */
router.post("/:id/payer", authenticateOwner, validateId, controllerWrapper(PremiumController.payerEtActiverPremium));

/**
 * POST /api/premium/:id/arreter - Arrêter la mise en avant d'un bien
 */
router.post("/:id/arreter", authenticateOwner, validateId, controllerWrapper(PremiumController.arreterPremium));

/**
 * GET /api/premium/:id/historique - Historique des mises en avant d'un bien
 */
router.get("/:id/historique", authenticateOwner, validateId, controllerWrapper(PremiumController.getHistoriqueBien));

/**
 * GET /api/premium/historique - Historique de toutes les mises en avant du propriétaire
 */
router.get("/historique", authenticateOwner, controllerWrapper(PremiumController.getHistoriquePaiements));

export default router;
