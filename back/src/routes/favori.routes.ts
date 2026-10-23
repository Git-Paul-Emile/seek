import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as FavoriController from "../controllers/favori.controller.js";
import { authenticateComptePublic } from "../middlewares/comptePublicAuth.middleware.js";

const router = Router();

router.use(authenticateComptePublic);

/** GET /api/public/favoris */
router.get("/", controllerWrapper(FavoriController.list));

/** GET /api/public/favoris/ids */
router.get("/ids", controllerWrapper(FavoriController.ids));

/** POST /api/public/favoris/:bienId/toggle */
router.post("/:bienId/toggle", controllerWrapper(FavoriController.toggle));

/** DELETE /api/public/favoris/:bienId */
router.delete("/:bienId", controllerWrapper(FavoriController.remove));

export default router;
