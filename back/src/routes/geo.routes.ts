import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as GeoController from "../controllers/geo.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

/** GET /api/geo/pays - liste des pays (public) */
router.get("/pays", controllerWrapper(GeoController.getPays));

/** GET /api/geo/pays/:paysId/villes - villes d'un pays (public) */
router.get("/pays/:paysId/villes", controllerWrapper(GeoController.getVilles));

/** GET /api/geo/villes/:villeId/quartiers - quartiers d'une ville (public) */
router.get("/villes/:villeId/quartiers", controllerWrapper(GeoController.getQuartiersByVille));

// ─── Admin - Pays ─────────────────────────────────────────────────────────────

/** GET /api/geo/admin/pays - tous les pays avec compteurs (admin) */
router.get("/admin/pays", authenticate, controllerWrapper(GeoController.getAllPaysAdmin));

/** POST /api/geo/pays */
router.post("/pays", authenticate, controllerWrapper(GeoController.createPays));

/** PUT /api/geo/pays/:id */
router.put("/pays/:id", authenticate, controllerWrapper(GeoController.updatePays));

/** DELETE /api/geo/pays/:id */
router.delete("/pays/:id", authenticate, controllerWrapper(GeoController.deletePays));

// ─── Admin - Villes ───────────────────────────────────────────────────────────

/** GET /api/geo/admin/villes - toutes les villes avec infos pays (admin) */
router.get("/admin/villes", authenticate, controllerWrapper(GeoController.getAllVillesAdmin));

/** POST /api/geo/villes */
router.post("/villes", authenticate, controllerWrapper(GeoController.createVille));

/** PUT /api/geo/villes/:id */
router.put("/villes/:id", authenticate, controllerWrapper(GeoController.updateVille));

/** DELETE /api/geo/villes/:id */
router.delete("/villes/:id", authenticate, controllerWrapper(GeoController.deleteVille));

// ─── Admin - Quartiers ────────────────────────────────────────────────────────

/** GET /api/geo/admin/quartiers - tous (filtrable par ?villeId=) (admin) */
router.get("/admin/quartiers", authenticate, controllerWrapper(GeoController.getAllQuartiersAdmin));

/** POST /api/geo/quartiers */
router.post("/quartiers", authenticate, controllerWrapper(GeoController.createQuartier));

/** PUT /api/geo/quartiers/:id */
router.put("/quartiers/:id", authenticate, controllerWrapper(GeoController.updateQuartier));

/** DELETE /api/geo/quartiers/:id */
router.delete("/quartiers/:id", authenticate, controllerWrapper(GeoController.deleteQuartier));

export default router;
