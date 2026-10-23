import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as StatutBienController from "../controllers/statutBien.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createStatutBienSchema,
  updateStatutBienSchema,
} from "../validators/statutBien.validator.js";

const router = Router();

/** GET /api/statuts-bien - public : statuts actifs */
router.get("/", controllerWrapper(StatutBienController.getAll));

/** GET /api/statuts-bien/admin - admin : tous les statuts */
router.get("/admin", authenticate, controllerWrapper(StatutBienController.getAllAdmin));

/** POST /api/statuts-bien - admin */
router.post(
  "/",
  authenticate,
  validate(createStatutBienSchema),
  controllerWrapper(StatutBienController.create)
);

/** PUT /api/statuts-bien/:id - admin */
router.put(
  "/:id",
  authenticate,
  validate(updateStatutBienSchema),
  controllerWrapper(StatutBienController.update)
);

/** DELETE /api/statuts-bien/:id - admin */
router.delete("/:id", authenticate, controllerWrapper(StatutBienController.remove));

export default router;
