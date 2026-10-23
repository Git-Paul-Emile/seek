import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as BienController from "../controllers/bien.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { uploadMediasMiddleware } from "../middlewares/uploadMultiple.middleware.js";
import { validateId } from "../middlewares/validateId.js";

const router = Router();

/** GET /api/biens/stats - statistiques du propriétaire connecté */
router.get(
  "/stats",
  authenticateOwner,
  controllerWrapper(BienController.getOwnerStatsController)
);

/** GET /api/biens/stats/vues - stats vues globales (toutes annonces du propriétaire) */
router.get(
  "/stats/vues",
  authenticateOwner,
  controllerWrapper(BienController.getStatsVuesOwnerController)
);

/** GET /api/biens/stats/favoris - stats favoris globales (toutes annonces du propriétaire) */
router.get(
  "/stats/favoris",
  authenticateOwner,
  controllerWrapper(BienController.getStatsFavorisOwnerController)
);

/** GET /api/biens/stats/vues/admin - stats vues globales admin */
router.get(
  "/stats/vues/admin",
  controllerWrapper(BienController.getAdminStatsVuesController)
);

/** GET /api/biens/draft - récupérer le brouillon du propriétaire */
router.get(
  "/draft",
  authenticateOwner,
  controllerWrapper(BienController.getDraft)
);

/** POST /api/biens/draft - enregistrer / mettre à jour le brouillon */
router.post(
  "/draft",
  authenticateOwner,
  uploadMediasMiddleware,
  controllerWrapper(BienController.saveDraft)
);

/** PATCH /api/biens/:id/soumettre - soumettre pour publication */
router.patch(
  "/:id/soumettre",
  authenticateOwner,
  validateId,
  controllerWrapper(BienController.soumettreAnnonce)
);

/** PATCH /api/biens/:id/retour-brouillon - annuler/dépublier vers brouillon */
router.patch(
  "/:id/retour-brouillon",
  authenticateOwner,
  validateId,
  controllerWrapper(BienController.retourBrouillon)
);

/** PATCH /api/biens/:id/annuler - annuler définitivement une annonce */
router.patch(
  "/:id/annuler",
  authenticateOwner,
  validateId,
  controllerWrapper(BienController.annulerAnnonce)
);

/** GET /api/biens - liste des biens du propriétaire */
router.get(
  "/",
  authenticateOwner,
  controllerWrapper(BienController.getBiens)
);

/** DELETE /api/biens/:id - supprimer un brouillon */
router.delete(
  "/:id",
  authenticateOwner,
  validateId,
  controllerWrapper(BienController.deleteBien)
);

/** GET /api/biens/:id/stats-vues - stats vues d'un bien (propriétaire) */
router.get(
  "/:id/stats-vues",
  authenticateOwner,
  validateId,
  controllerWrapper(BienController.getStatsVuesBienController)
);

/** GET /api/biens/:id/stats-favoris - stats favoris d'un bien (propriétaire) */
router.get(
  "/:id/stats-favoris",
  authenticateOwner,
  validateId,
  controllerWrapper(BienController.getStatsFavorisBienController)
);

/** GET /api/biens/:id */
router.get(
  "/:id",
  validateId,
  controllerWrapper(BienController.getBienById)
);

/** GET /api/biens/public/dernieres - dernières annonces publiées (pour page d'accueil) */
router.get(
  "/public/dernieres",
  controllerWrapper(BienController.getDernieresAnnonces)
);

/** GET /api/biens/public/lieux - quartiers + villes distincts des annonces publiées */
router.get(
  "/public/lieux",
  controllerWrapper(BienController.getDistinctLieux)
);

/** GET /api/biens/public/recherche - recherche publique avec filtres */
router.get(
  "/public/recherche",
  controllerWrapper(BienController.searchAnnoncesPubliques)
);

/** GET /api/biens/public/:id - une annonce publiée (accessible publiquement) */
router.get(
  "/public/:id",
  validateId,
  controllerWrapper(BienController.getAnnoncePublie)
);

/** GET /api/biens/public/:id/similaires - annonces similaires */
router.get(
  "/public/:id/similaires",
  validateId,
  controllerWrapper(BienController.getAnnoncesSimilaires)
);

export default router;
